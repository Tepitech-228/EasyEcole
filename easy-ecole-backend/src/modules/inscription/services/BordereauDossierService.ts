import express from "express";
import { Transaction } from "sequelize";
import { Bordereau } from "../models/Bordereau";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { ParcoursChoisi } from "../models/ParcoursChoisi";
import { Cours } from "../models/Cours";
import { DemandeInscriptionCours } from "../models/DemandeInscriptionCours";
import { CursusApprenant } from "../models/CursusApprenant";
import { Echeance } from "../models/Echeance";
import { PaiementInscription } from "../models/PaiementInscription";
import { Quitus } from "../models/Quitus";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { NiveauEtude } from "../models/NiveauEtude";
import { Session } from "../models/Session";
import { CoursParticipant } from "../models/CoursParticipant";
import { Apprenant } from "../../auth/models/Apprenant";
import { ReponseInscription } from "../models/ReponseInscription";
import { PreInscription, EtatPreInscription } from "../models/PreInscription";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EtatsCoursChoisi } from "../../../core/enums/EtatsCoursChoisi";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { GenerateurCarteService } from "../services/GenerateurCarteService";
import { DossierStorageService } from "../services/DossierStorageService";
import { FolderAutoService } from "../../ged/services/FolderAutoService";
import { GenerateurEcheancierService, estModalitePaiement } from "../services/GenerateurEcheancierService";
import { GenerateurEcheancierScolariteService } from "../services/GenerateurEcheancierScolariteService";
import { nombreEcheances } from "../services/GenerateurEcheancierSessionService";
import { SnapshotService } from "../services/SnapshotService";
import { TarifService } from "../services/TarifService";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import path from "path";
import fs from "fs";

// Helpers dupliqués localement (source pure) pour éviter une dépendance
// circulaire avec BordereauController, qui importe ce service.
const isChoixFinalValue = (value: unknown): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true';
    }
    return false;
};

const hasChoixFinal = (parcoursChoisis?: Array<{ choixFinal?: any; parcoursId?: number | string | null }> | null): boolean => {
    if (!Array.isArray(parcoursChoisis) || parcoursChoisis.length === 0) return false;
    if (parcoursChoisis.length === 1) return true;
    return parcoursChoisis.some(pc => isChoixFinalValue(pc?.choixFinal));
};

const getParcoursFinal = <T extends { choixFinal?: any; parcoursId?: number | string | null }>(parcoursChoisis?: Array<T> | null): T | undefined => {
    if (!Array.isArray(parcoursChoisis) || parcoursChoisis.length === 0) return undefined;
    const explicit = parcoursChoisis.find(pc => isChoixFinalValue(pc?.choixFinal));
    if (explicit) return explicit;
    if (parcoursChoisis.length === 1) return parcoursChoisis[0];
    return undefined;
};

export class BordereauDossierService {

    static async creerDossierEtudiantDepuisBordereau(
        bordereau: Bordereau,
        req: any,
        transaction: Transaction,
        options?: { ignorerVerifFrais?: boolean; pedagogieDifferee?: boolean },
    ): Promise<void> {
        const demande = await DemandeInscription.findOne({
            where: { utilisateurId: bordereau.utilisateurId },
            include: [
                { association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                { association: DemandeInscription.associations.preInscription },
                { association: DemandeInscription.associations.session, include: [Session.associations.dossiersInscription, Session.associations.fraisInscription, Session.associations.fraisScolarite, Session.associations.anneeAcademique] },
                { association: DemandeInscription.associations.dossiersDemande },
                { association: DemandeInscription.associations.cours, include: [Cours.associations.classe] },
                { association: DemandeInscription.associations.coursChoisis },
                DemandeInscription.associations.paiementsInscription,
                DemandeInscription.associations.reponseInscription,
            ],
            order: [['createdAt', 'DESC']],
            transaction,
        })

        if (!demande) {
            throw new Error("Aucune demande d'inscription trouvée")
        }

        if (!demande.utilisateur?.apprenant) {
            throw new Error("Informations personnelles incomplètes")
        }
        if (!demande.parcoursChoisis || demande.parcoursChoisis.length === 0) {
            throw new Error("Aucun parcours choisi")
        }

        // Période de cours + admission : vérifiés/posés à la FINALISATION (comité)
        // lorsque la pédagogie est différée.
        let typeCoursPeriode: 'jour' | 'soir' = 'jour'
        if (!options?.pedagogieDifferee) {
            const periodeEtudiant = demande.utilisateur?.apprenant?.periode
            if (periodeEtudiant !== 'matin' && periodeEtudiant !== 'soir' && periodeEtudiant !== 'en_ligne') {
                throw new Error("L'étudiant doit renseigner sa période (cours du matin, du soir ou en ligne) dans ses informations personnelles avant validation")
            }
            typeCoursPeriode = periodeEtudiant === 'soir' ? 'soir' : 'jour'

            let reponseInscription = demande.reponseInscription
            if (!reponseInscription) {
                reponseInscription = await ReponseInscription.create({
                    message: "Admission accordée automatiquement suite à la validation du bordereau",
                    dateReponse: new Date(),
                    utilisateurId: (req as any).utilisateurId,
                    demandeInscriptionId: demande.id
                }, { transaction })
                try {
                    await EmailSender.getInstance().sendReponseInscription(
                        demande.utilisateur?.identifiant ?? '',
                        demande.utilisateur?.email ?? '',
                        reponseInscription.message
                    )
                } catch (emailError) {
                    console.error("Erreur envoi email d'admission:", emailError)
                }
            }
        }
        if (!hasChoixFinal(demande.parcoursChoisis)) {
            throw new Error("Aucun parcours final sélectionné")
        }
        const dossiersRequis = demande.session?.dossiersInscription || []
        const dossiersUploades = demande.dossiersDemande || []
        if (dossiersRequis.length > 0 && dossiersUploades.length !== dossiersRequis.length) {
            throw new Error("Tous les documents requis doivent être téléversés")
        }
        if (!demande.preInscription || demande.preInscription.statut !== EtatPreInscription.VALIDE) {
            throw new Error("La préinscription doit être validée")
        }

        const parcoursFinal = getParcoursFinal(demande.parcoursChoisis)
        const parcoursChoisiFinal = getParcoursFinal(demande.parcoursChoisis)

        const coursDuParcours = parcoursFinal?.parcoursId
            ? await Cours.findAll({
                where: { parcoursId: parcoursFinal.parcoursId },
                include: [Cours.associations.classe]
            })
            : []

        const coursObligatoires = coursDuParcours.filter(c => c.estObligatoire)
        if (coursObligatoires.length > 0) {
            const coursChoisisIds = (demande.coursChoisis || []).map(cc => cc.coursId)
            const obligatoiresManquants = coursObligatoires
                .filter(c => !coursChoisisIds.includes(c.id))
                .map(c => ({ coursId: c.id, demandeInscriptionId: demande.id, etat: EtatsCoursChoisi.VALIDE }))
            if (obligatoiresManquants.length > 0) {
                await DemandeInscriptionCours.bulkCreate(obligatoiresManquants, { transaction })
            }
        }

        const fraisTotal = (demande.session?.fraisInscription || []).reduce((sum, f) => sum + f.montant, 0)
        const fraisPayes = (demande.paiementsInscription || []).reduce((sum, p) => sum + (p.montant || 0), 0)
        if (!options?.ignorerVerifFrais && fraisPayes < fraisTotal) {
            throw new Error("Les frais d'inscription ne sont pas entièrement payés")
        }

        const parcoursFinalForCursus = getParcoursFinal(demande.parcoursChoisis)

        const anneeLibelle = demande.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()
        const parcoursData = parcoursFinalForCursus?.parcours

        const classeDerivee = coursDuParcours.find(c => c.classe?.id)?.classe ?? null
        // Option A : en pédagogie différée (saisie ESA-COMPTA du premier bordereau),
        // l'absence de classe ne bloque PAS le processus financier : l'étudiant est
        // créé avec une classe "À affecter", qui sera rattachée plus tard lors de la
        // finalisation pédagogique (comité). La classe reste obligatoire en validation
        // complète (affectation définitive).
        if ((!classeDerivee || !classeDerivee.id) && !options?.pedagogieDifferee) {
            throw new Error("Aucune classe n'a pu être déterminée pour le parcours final")
        }

        const etablissementId = parcoursData?.etablissementId ?? classeDerivee?.etablissementId
        const etablissement = etablissementId
            ? await Etablissement.findByPk(etablissementId, { transaction })
            : null

        const MATRICULE_FINAL_REGEX = /^[0-9]+-[A-Z]+[0-9]?[JS]-[0-9]{2}-[A-Z]+$/
        const matriculeExistant = demande.matricule
        const estFormatFinal = typeof matriculeExistant === 'string'
            && MATRICULE_FINAL_REGEX.test(matriculeExistant)

        let matricule: string
        if (options?.pedagogieDifferee) {
            // Pédagogie différée : le matricule FINAL sera généré par la validation
            // du comité (finaliserAffectationPedagogique). On utilise ici le
            // matricule temporaire de la demande (NOT NULL) pour satisfaire les FK.
            matricule = demande.matricule
        } else if (estFormatFinal) {
            matricule = matriculeExistant
        } else {
            const ordre = await DossierEtudiant.count() + 1
            matricule = IDGenerator.getInstance().generateMatriculeFinal(
                parcoursData!,
                anneeLibelle,
                classeDerivee,
                ordre,
                etablissement,
                typeCoursPeriode
            )
            await demande.update({ matricule, dateValidation: new Date() }, { transaction })
        }

        const paiementsAMettreAJour = (demande.paiementsInscription || [])
            .filter(p => p.matriculeInscription && p.matriculeInscription !== matricule)
        for (const paiement of paiementsAMettreAJour) {
            await paiement.update({ matriculeInscription: matricule }, { transaction })
        }

        const niveauEtudeId = parcoursData?.niveauEtudeId ?? classeDerivee?.niveauEtudeId
        const niveauEtude = niveauEtudeId
            ? await NiveauEtude.findByPk(niveauEtudeId, { transaction })
            : null
        const parcoursNom = parcoursData?.type || parcoursData?.titre || 'PARCOURS'
        const niveauNom = niveauEtude?.libelle || 'Niveau'
        const classeNom = classeDerivee?.libelle ?? 'À affecter'
        const anneeId = demande.session?.anneeAcademiqueId

        if (!options?.pedagogieDifferee) {
            try {
                DossierStorageService.creerDossierEtudiant(
                    anneeLibelle,
                    parcoursNom,
                    classeNom,
                    niveauNom,
                    matricule,
                );
            } catch (dirError) {
                console.error("Erreur création dossier étudiant:", dirError);
            }

            try {
                if (anneeId && parcoursData && niveauEtude) {
                    await FolderAutoService.creerDossierMatricule({
                        anneeAcademiqueId: Number(anneeId),
                        parcoursNom,
                        classeNom,
                        niveauNom,
                        matricule,
                        utilisateurId: Number((req as any).utilisateurId),
                    });
                }
            } catch (gedError) {
                console.error("Erreur création dossier GED matricule:", gedError)
            }
        }

        let savedCursusId: number | null = null
        if (!options?.pedagogieDifferee) {
            const [savedCursus] = await CursusApprenant.findOrCreate({
                where: { demandeInscriptionId: demande.id },
                defaults: {
                    externe: false,
                    intituleParcours: parcoursNom,
                    parcoursId: parcoursChoisiFinal?.parcoursId!,
                    niveauEtudeId: niveauEtudeId!,
                    // En validation complète (non différée), la garde ci-dessus garantit
                    // que classeDerivee est renseignée : non-null assertion safe.
                    classeId: classeDerivee!.id!,
                    anneeAcademiqueId: anneeId!,
                    utilisateurId: demande.utilisateurId,
                    demandeInscriptionId: demande.id,
                },
                transaction
            })
            savedCursusId = savedCursus.id
        }

        const demarrage = parcoursChoisiFinal?.createdAt || demande.createdAt || new Date()
        let dossier = await DossierEtudiant.findOne({ where: { matricule } })
        if (!dossier) {
            const codeQR = JSON.stringify({ matricule, utilisateurId: bordereau.utilisateurId })
            dossier = new DossierEtudiant()
            dossier.utilisateurId = bordereau.utilisateurId
            dossier.matricule = matricule
            dossier.codeQR = codeQR
            dossier.statut = 'actif'
            dossier.fraisScolarite = fraisTotal
            dossier.modePaiement = 'mensuel'
            dossier.nbMensualites = 10
            dossier.demarrageParcours = demarrage
            await dossier.save({ transaction })
        }

        await Echeance.destroy({
            where: { dossierEtudiantId: dossier.id, type: 'inscription', statut: ['impaye', 'en_retard'] },
            transaction
        })
        // Échéancier d'inscription basé sur les VRAIS frais de la session
        // (fraisInscription), JAMAIS sur le montant du bordereau : le montant saisi
        // peut déborder des frais (ex : 480 000 versés pour 450 000 de frais) et
        // l'excédent doit rester imputable sur la scolarité par l'imputation FIFO
        // appelée juste après (FinanceRouter.saisir).
        // Aucun statut 'paye' n'est posé ici : c'est le lettrage FIFO qui solde
        // l'échéance avec le bon montantPaye (traçabilité BordereauEcheance).
        if (fraisTotal > 0) {
            await GenerateurEcheancierService.generer(
                dossier,
                bordereau.modalite,
                transaction,
                fraisTotal
            )
        }

        if (!options?.pedagogieDifferee) {
            try {
                const user = demande.utilisateur as any
                const apprenant = user?.apprenant
                const cartePath = await GenerateurCarteService.generer({
                    nom: user?.nom || '',
                    prenom: user?.prenoms || '',
                    matricule: matricule,
                    dateNaissance: String(apprenant?.dateNaissance || ''),
                    photo: dossier.photo || undefined,
                    classe: parcoursNom,
                    filiere: classeNom,
                    anneeAcademique: anneeLibelle,
                    email: user?.email || '',
                    utilisateurId: demande.utilisateurId,
                })
                await dossier.update({ cartePath, carteGeneree: true }, { transaction })

                const carteSource = path.resolve(process.cwd(), 'public', cartePath)
                if (fs.existsSync(carteSource)) {
                    DossierStorageService.copierFichier(
                        carteSource,
                        anneeLibelle, parcoursNom, classeNom, niveauNom, matricule, 'cartes'
                    )
                }
            } catch (cardError) {
                console.error("Erreur génération carte étudiant:", cardError)
            }
        }

        if (bordereau.echeanceId) {
            const echeance = await Echeance.findByPk(bordereau.echeanceId, { transaction })
            if (echeance) {
                echeance.dossierEtudiantId = dossier.id
                await echeance.save({ transaction })
            }
        }

        if (!options?.pedagogieDifferee) {
            const coursChoisisFinal = await DemandeInscriptionCours.findAll({
                where: { demandeInscriptionId: demande.id }
            })
            for (const coursChoisi of coursChoisisFinal) {
                if (coursChoisi.etat === EtatsCoursChoisi.VALIDE) {
                    await CoursParticipant.findOrCreate({
                        where: {
                            utilisateurId: demande.utilisateurId,
                            coursId: coursChoisi.coursId,
                        },
                        defaults: {
                            utilisateurId: demande.utilisateurId,
                            coursId: coursChoisi.coursId,
                            cursusApprenantId: savedCursusId!,
                        },
                        transaction
                    })
                }
            }
        }

        const fraisScolariteSession = (demande.session?.fraisScolarite || []).find(f => f.actif) ?? null
        if (fraisScolariteSession) {
            await Echeance.destroy({
                where: { dossierEtudiantId: dossier.id, type: 'scolarite', statut: ['impaye', 'en_retard'] },
                transaction
            })
            dossier.fraisScolarite = fraisScolariteSession.montant
            dossier.modePaiement = fraisScolariteSession.modalite === '1x' ? 'unique' : 'mensuel'
            dossier.nbMensualites = nombreEcheances(fraisScolariteSession.modalite)
            await dossier.save({ transaction })
            await GenerateurEcheancierScolariteService.generer(dossier, fraisScolariteSession, transaction)
        }

        // Grille tarifaire résolue (FraisParcours en priorité, fallback FraisScolarite session).
        let grille: any = null
        try {
            if (parcoursData?.id && niveauEtudeId && anneeId && demande.sessionId) {
                grille = await TarifService.resoudre(
                    Number(parcoursData.id),
                    Number(niveauEtudeId),
                    Number(anneeId),
                    Number(demande.sessionId),
                    transaction
                )
            }
        } catch (grilleError) {
            console.warn("[BordereauDossier] Grille tarifaire introuvable:", (grilleError as Error).message)
        }

        if (!fraisScolariteSession && grille?.montantScolarite && Number(grille.montantScolarite) > 0) {
            await GenerateurEcheancierScolariteService.generer(
                dossier,
                { montant: grille.montantScolarite, modalite: grille.modaliteScolarite } as any,
                transaction
            )
        }

        // Échéance représentative des frais d'entrée : la modalité '1x' (défaut depuis
        // que l'étudiant ne choisit plus) ne génère aucun échéancier d'inscription.
        // Sans cette ligne, les frais d'inscription ne seraient jamais déduits par la
        // FIFO lors de la saisie comptable du premier bordereau.
        const montantInscriptionGrille = Number(grille?.montantInscription || 0)
        if (montantInscriptionGrille > 0) {
            const echeanceInscriptionExistante = await Echeance.findOne({
                where: { dossierEtudiantId: dossier.id, type: 'inscription' },
                transaction,
            })
            if (!echeanceInscriptionExistante) {
                await Echeance.create({
                    dossierEtudiantId: dossier.id,
                    type: 'inscription',
                    numeroEcheance: 1,
                    montant: montantInscriptionGrille,
                    montantPaye: 0,
                    dateLimite: new Date(),
                    statut: 'impaye',
                } as any, { transaction })
            }
        }

        // Snapshot comptable figé à la première validation du dossier (immutabilité).
        if (grille) {
            await SnapshotService.appliquer(dossier, grille, transaction)
        }

        const paiement = new PaiementInscription()
        paiement.numero = 'PAY-' + IDGenerator.getInstance().generateNumeroPaiement()
        paiement.datePaiement = new Date()
        paiement.montant = bordereau.montant ?? 0
        paiement.matriculeInscription = matricule
        paiement.type = TypesPaiement.EN_LIGNE
        paiement.utilisateurId = bordereau.utilisateurId
        paiement.description = `Paiement par bordereau #${bordereau.id} (${bordereau.type || 'inscription'})`
        await paiement.save({ transaction })

        if (demande.dossiersDemande && savedCursusId) {
            for (const doc of demande.dossiersDemande) {
                await ArchiveGedService.archiverDocumentInscription(
                    Number(demande.id),
                    doc.nomFichier,
                    {
                        titre: `Dossier inscription - ${matricule}`,
                        anneeAcademiqueId: Number(demande.session?.anneeAcademiqueId!),
                        parcoursId: Number(parcoursChoisiFinal?.parcoursId!),
                        niveauEtudeId: Number(parcoursChoisiFinal?.parcours?.niveauEtudeId!),
                        classeId: undefined,
                        cursusApprenantId: Number(savedCursusId)
                    }
                )
            }
        }

        if (bordereau.fichier) {
            await ArchiveGedService.archiverBordereau(
                Number(bordereau.id),
                bordereau.fichier,
                {
                    titre: `Bordereau ${bordereau.type} - ${bordereau.referenceBancaire || bordereau.id}`,
                    anneeAcademiqueId: Number(demande.session?.anneeAcademiqueId!),
                    parcoursId: Number(parcoursChoisiFinal?.parcoursId!),
                    niveauEtudeId: Number(parcoursChoisiFinal?.parcours?.niveauEtudeId!)
                }
            )
        }

        try {
            const baseChemin = { annee: anneeLibelle, parcours: parcoursNom, classe: classeNom, niveau: niveauNom, matricule };

            if (demande.dossiersDemande) {
                for (const doc of demande.dossiersDemande) {
                    const sourcePath = path.resolve(process.cwd(), 'public/inscription/dossiers', doc.nomFichier);
                    if (fs.existsSync(sourcePath)) {
                        const newPath = DossierStorageService.deplacerFichier(
                            sourcePath,
                            baseChemin.annee, baseChemin.parcours, baseChemin.classe,
                            baseChemin.niveau, baseChemin.matricule, 'dossiers'
                        );
                        doc.nomFichier = DossierStorageService.cheminRelatif(newPath);
                        await doc.save({ transaction });
                    }
                }
            }

            if (demande.preInscription?.autorisationPDF) {
                const ref = demande.preInscription.autorisationPDF;
                const candidats = [
                    path.resolve(process.cwd(), 'storage', 'docgen', ref.endsWith('.pdf') ? ref : `${ref}.pdf`),
                    path.resolve(process.cwd(), 'public/inscription/autorisations', ref),
                    path.resolve(process.cwd(), ref),
                ];
                const sourcePath = candidats.find(p => fs.existsSync(p));
                if (sourcePath) {
                    const newPath = DossierStorageService.deplacerFichier(
                        sourcePath,
                        baseChemin.annee, baseChemin.parcours, baseChemin.classe,
                        baseChemin.niveau, baseChemin.matricule, 'autorisations'
                    );
                    demande.preInscription.autorisationPDF = DossierStorageService.cheminRelatif(newPath);
                    await demande.preInscription.save({ transaction });
                }
            }

            if (bordereau.fichier) {
                const sourcePath = path.resolve(process.cwd(), 'public/inscription/bordereaux', bordereau.fichier);
                if (fs.existsSync(sourcePath)) {
                    const newPath = DossierStorageService.deplacerFichier(
                        sourcePath,
                        baseChemin.annee, baseChemin.parcours, baseChemin.classe,
                        baseChemin.niveau, baseChemin.matricule, 'bordereaux'
                    );
                    bordereau.fichier = DossierStorageService.cheminRelatif(newPath);
                    await bordereau.save({ transaction });
                }
            }
        } catch (moveError) {
            console.error("Erreur déplacement fichiers:", moveError);
        }

        if (!options?.pedagogieDifferee && demande.utilisateur) {
            EmailSender.getInstance().sendQuitusEtMatricule(
                demande.utilisateur.identifiant,
                demande.utilisateur.email,
                matricule
            ).catch((err: any) => console.error("Erreur envoi email matricule:", err))
        }
    }

    /**
     * FINALISATION de l'inscription par le COMITÉ (validation finale) :
     *   - admission posée (réponse d'inscription) ;
     *   - génération du MATRICULE définitif + propagation sur la demande,
     *     le dossier étudiant et les paiements ;
     *   - affectation pédagogique : cursus + cours participants (obligatoires
     *     du parcours ajoutés automatiquement) ;
     *   - carte étudiante, dossier physique et GED ;
     *   - email officiel avec matricule.
     * Idempotent : si un cursus existe déjà pour la demande, on complète
     * uniquement ce qui manque.
     */
    static async finaliserAffectationPedagogique(
        utilisateurId: number,
        req: any,
        transaction: Transaction,
    ): Promise<{ matricule: string }> {
        const demande = await DemandeInscription.findOne({
            where: { utilisateurId },
            include: [
                { association: DemandeInscription.associations.utilisateur, include: [{ model: Apprenant, as: 'apprenant' }] },
                { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                { association: DemandeInscription.associations.session, include: [Session.associations.anneeAcademique] },
                { association: DemandeInscription.associations.cours, include: [Cours.associations.classe] },
                { association: DemandeInscription.associations.coursChoisis },
                DemandeInscription.associations.paiementsInscription,
                DemandeInscription.associations.reponseInscription,
            ],
            order: [['createdAt', 'DESC']],
            transaction,
        })
        if (!demande) throw new Error("Aucune demande d'inscription trouvée")
        if (!demande.utilisateur?.apprenant) throw new Error("Informations personnelles incomplètes")

        const periodeEtudiant = demande.utilisateur?.apprenant?.periode
        if (periodeEtudiant !== 'matin' && periodeEtudiant !== 'soir' && periodeEtudiant !== 'en_ligne') {
            throw new Error("L'étudiant doit renseigner sa période (cours du matin, du soir ou en ligne) dans ses informations personnelles avant validation")
        }
        const typeCoursPeriode: 'jour' | 'soir' = periodeEtudiant === 'soir' ? 'soir' : 'jour'

        if (!demande.reponseInscription) {
            await ReponseInscription.create({
                message: "Admission accordée suite à la validation du comité",
                dateReponse: new Date(),
                utilisateurId: (req as any).utilisateurId,
                demandeInscriptionId: demande.id
            }, { transaction })
        }

        const parcoursFinal = getParcoursFinal(demande.parcoursChoisis)
        const parcoursData = parcoursFinal?.parcours

        const coursDuParcours = parcoursFinal?.parcoursId
            ? await Cours.findAll({ where: { parcoursId: parcoursFinal.parcoursId }, include: [Cours.associations.classe] })
            : []
        const classeDerivee = coursDuParcours.find(c => c.classe?.id)?.classe ?? null
        if (!classeDerivee || !classeDerivee.id) {
            throw new Error("Aucune classe n'a pu être déterminée pour le parcours final")
        }

        const coursObligatoires = coursDuParcours.filter(c => c.estObligatoire)
        if (coursObligatoires.length > 0) {
            const coursChoisisIds = (demande.coursChoisis || []).map((cc: any) => cc.coursId)
            const obligatoiresManquants = coursObligatoires
                .filter(c => !coursChoisisIds.includes(c.id))
                .map(c => ({ coursId: c.id, demandeInscriptionId: demande.id, etat: EtatsCoursChoisi.VALIDE }))
            if (obligatoiresManquants.length > 0) {
                await DemandeInscriptionCours.bulkCreate(obligatoiresManquants, { transaction })
            }
        }

        // Matricule définitif (réutilisé si déjà au format final — idempotence).
        const anneeLibelle = demande.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()
        const etablissementId = parcoursData?.etablissementId ?? classeDerivee.etablissementId
        const etablissement = etablissementId ? await Etablissement.findByPk(etablissementId, { transaction }) : null

        const MATRICULE_FINAL_REGEX = /^[0-9]+-[A-Z]+[0-9]?[JS]-[0-9]{2}-[A-Z]+$/
        let matricule: string
        if (typeof demande.matricule === 'string' && MATRICULE_FINAL_REGEX.test(demande.matricule)) {
            matricule = demande.matricule
        } else {
            const ordre = await DossierEtudiant.count() + 1
            if (!parcoursData) throw new Error("Parcours introuvable pour la génération du matricule")
            matricule = IDGenerator.getInstance().generateMatriculeFinal(
                parcoursData, anneeLibelle, classeDerivee, ordre, etablissement, typeCoursPeriode
            )
            await demande.update({ matricule, dateValidation: new Date() }, { transaction })
        }

        for (const paiement of (demande.paiementsInscription || [])) {
            if (paiement.matriculeInscription && paiement.matriculeInscription !== matricule) {
                await paiement.update({ matriculeInscription: matricule }, { transaction })
            }
        }
        const dossier = await DossierEtudiant.findOne({
            where: { utilisateurId },
            order: [['id', 'DESC']],
            transaction,
        })
        if (dossier && dossier.matricule !== matricule) {
            await dossier.update({ matricule }, { transaction })
        }

        const niveauEtudeId = parcoursData?.niveauEtudeId ?? classeDerivee.niveauEtudeId
        const niveauEtude = niveauEtudeId ? await NiveauEtude.findByPk(niveauEtudeId, { transaction }) : null
        const parcoursNom = parcoursData?.type || parcoursData?.titre || 'PARCOURS'
        const niveauNom = niveauEtude?.libelle || 'Niveau'
        const classeNom = classeDerivee.libelle
        const anneeId = demande.session?.anneeAcademiqueId

        try {
            DossierStorageService.creerDossierEtudiant(anneeLibelle, parcoursNom, classeNom, niveauNom, matricule);
        } catch (dirError) {
            console.error("Erreur création dossier étudiant:", dirError);
        }

        try {
            if (anneeId && parcoursData && niveauEtude) {
                await FolderAutoService.creerDossierMatricule({
                    anneeAcademiqueId: Number(anneeId),
                    parcoursNom, classeNom, niveauNom, matricule,
                    utilisateurId: Number((req as any).utilisateurId),
                });
            }
        } catch (gedError) {
            console.error("Erreur création dossier GED matricule:", gedError)
        }

        const [savedCursus] = await CursusApprenant.findOrCreate({
            where: { demandeInscriptionId: demande.id },
            defaults: {
                externe: false,
                intituleParcours: parcoursNom,
                parcoursId: parcoursFinal!.parcoursId!,
                niveauEtudeId: niveauEtudeId!,
                classeId: classeDerivee.id!,
                anneeAcademiqueId: anneeId!,
                utilisateurId: demande.utilisateurId,
                demandeInscriptionId: demande.id,
            },
            transaction
        })

        const coursChoisisFinal = await DemandeInscriptionCours.findAll({
            where: { demandeInscriptionId: demande.id }
        })
        for (const coursChoisi of coursChoisisFinal) {
            if (coursChoisi.etat === EtatsCoursChoisi.VALIDE) {
                await CoursParticipant.findOrCreate({
                    where: { utilisateurId: demande.utilisateurId, coursId: coursChoisi.coursId },
                    defaults: {
                        utilisateurId: demande.utilisateurId,
                        coursId: coursChoisi.coursId,
                        cursusApprenantId: savedCursus.id,
                    },
                    transaction
                })
            }
        }

        if (dossier) {
            try {
                const user = demande.utilisateur as any
                const apprenant = user?.apprenant
                const cartePath = await GenerateurCarteService.generer({
                    nom: user?.nom || '',
                    prenom: user?.prenoms || '',
                    matricule,
                    dateNaissance: String(apprenant?.dateNaissance || ''),
                    photo: dossier.photo || undefined,
                    classe: parcoursNom,
                    filiere: classeNom,
                    anneeAcademique: anneeLibelle,
                    email: user?.email || '',
                    utilisateurId: demande.utilisateurId,
                })
                await dossier.update({ cartePath, carteGeneree: true }, { transaction })

                const carteSource = path.resolve(process.cwd(), 'public', cartePath)
                if (fs.existsSync(carteSource)) {
                    DossierStorageService.copierFichier(carteSource, anneeLibelle, parcoursNom, classeNom, niveauNom, matricule, 'cartes')
                }
            } catch (cardError) {
                console.error("Erreur génération carte étudiant:", cardError)
            }
        }

        if (demande.utilisateur) {
            EmailSender.getInstance().sendQuitusEtMatricule(
                demande.utilisateur.identifiant,
                demande.utilisateur.email,
                matricule
            ).catch((err: any) => console.error("Erreur envoi email matricule:", err))
        }

        return { matricule }
    }

    /**
     * Génère le quitus de scolarité d'un bordereau validé (PDF + archivage GED +
     * copie dans le dossier étudiant + email). Appelé par ESA-COMPTA lors de la
     * saisie d'un bordereau de type 'scolarite'. Idempotent (un seul quitus par
     * bordereau).
     */
    static async genererQuitusScolarite(bordereau: Bordereau, transaction: Transaction): Promise<void> {
        const existingQuitus = await Quitus.findOne({ where: { bordereauId: bordereau.id }, transaction })
        if (existingQuitus) return

        const echeance = bordereau.echeanceId ? await Echeance.findByPk(bordereau.echeanceId, { transaction }) : null
        if (!echeance?.dossierEtudiantId) return

        const dossier = await DossierEtudiant.findByPk(echeance.dossierEtudiantId, {
            include: [DossierEtudiant.associations.utilisateur],
            transaction,
        })
        if (!dossier) return

        const code = 'QTS-' + IDGenerator.getInstance().generateNumeroPaiement()
        const etudiantNom = dossier.utilisateur ? dossier.utilisateur.nom + ' ' + dossier.utilisateur.prenoms : 'Étudiant'

        const filename = DocumentPDFGenerator.generateQuitus(
            bordereau.id,
            code,
            etudiantNom,
            dossier.matricule,
            bordereau.montant ?? 0,
            new Date(),
            "public/inscription/quitus/"
        )

        let quitus = new Quitus()
        quitus.bordereauId = bordereau.id
        quitus.code = code
        quitus.fichierPDF = filename
        quitus.statut = 'genere'
        await quitus.save({ transaction })

        ArchiveGedService.archiverDepuisFichier({
            fichierSource: `public/inscription/quitus/${filename}`,
            domaineCode: 'FIN',
            typeDocumentCode: 'bordereau',
            processusCode: 'BORDEREAU',
            processusLibelle: 'Bordereau de paiement',
            processusModule: 'finance',
            titre: `Quitus scolarité - ${code}`,
            dossierGed: 'Bordereaux de paiement',
            sourceType: 'genere_application',
            confidentialite: 'confidentiel',
        }).catch((err: any) => console.error("Erreur archivage quitus scolarite:", err))

        try {
            if (dossier.matricule) {
                const quitusSource = path.resolve(process.cwd(), 'public/inscription/quitus', filename)
                if (fs.existsSync(quitusSource)) {
                    const demandeQuitus = await DemandeInscription.findOne({
                        where: { matricule: dossier.matricule },
                        include: [
                            { association: DemandeInscription.associations.session, include: [Session.associations.anneeAcademique] },
                            { association: DemandeInscription.associations.parcoursChoisis, include: [{ association: ParcoursChoisi.associations.parcours }] },
                        ]
                    })
                    if (demandeQuitus) {
                        const pFinal = demandeQuitus.parcoursChoisis?.find(pc => isChoixFinalValue(pc.choixFinal))
                        const pData = pFinal?.parcours
                        const ne = pData?.niveauEtudeId
                            ? await NiveauEtude.findByPk(pData.niveauEtudeId, { transaction })
                            : null
                        const ann = demandeQuitus.session?.anneeAcademique?.libelle || ''
                        const parc = pData?.type || pData?.titre || ''
                        const niv = ne?.libelle || ''

                        DossierStorageService.copierFichier(
                            quitusSource,
                            ann, parc, 'NON_DEFINI', niv, dossier.matricule, 'paiements'
                        )
                    }
                }
            }
        } catch (quitusMoveError) {
            console.error("Erreur copie quitus etudiant:", quitusMoveError)
        }

        if (dossier.utilisateur) {
            EmailSender.getInstance().sendQuitusEtMatricule(
                dossier.utilisateur.identifiant,
                dossier.utilisateur.email,
                dossier.matricule
            ).catch((err: any) => console.error("Erreur envoi email quitus:", err))
        }
    }
}
