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
import { hasChoixFinal, getParcoursFinal } from "../controllers/BordereauController";
import path from "path";
import fs from "fs";

export class BordereauDossierService {

    static async creerDossierEtudiantDepuisBordereau(
        bordereau: Bordereau,
        req: express.Request,
        transaction: Transaction,
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

        const periodeEtudiant = demande.utilisateur?.apprenant?.periode
        if (periodeEtudiant !== 'matin' && periodeEtudiant !== 'soir') {
            throw new Error("L'étudiant doit renseigner sa période (cours du matin ou du soir) dans ses informations personnelles avant validation")
        }
        const typeCoursPeriode: 'jour' | 'soir' = periodeEtudiant === 'matin' ? 'jour' : 'soir'

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
        if (fraisPayes < fraisTotal) {
            throw new Error("Les frais d'inscription ne sont pas entièrement payés")
        }

        const parcoursFinalForCursus = getParcoursFinal(demande.parcoursChoisis)

        const anneeLibelle = demande.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()
        const parcoursData = parcoursFinalForCursus?.parcours

        const classeDerivee = coursDuParcours.find(c => c.classe?.id)?.classe ?? null
        if (!classeDerivee || !classeDerivee.id) {
            throw new Error("Aucune classe n'a pu être déterminée pour le parcours final")
        }

        const etablissementId = parcoursData?.etablissementId ?? classeDerivee.etablissementId
        const etablissement = etablissementId
            ? await Etablissement.findByPk(etablissementId, { transaction })
            : null

        const MATRICULE_FINAL_REGEX = /^[0-9]+-[A-Z]+[0-9]?[JS]-[0-9]{2}-[A-Z]+$/
        const matriculeExistant = demande.matricule
        const estFormatFinal = typeof matriculeExistant === 'string'
            && MATRICULE_FINAL_REGEX.test(matriculeExistant)

        let matricule: string
        if (estFormatFinal) {
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

        const niveauEtudeId = parcoursData?.niveauEtudeId ?? classeDerivee.niveauEtudeId
        const niveauEtude = niveauEtudeId
            ? await NiveauEtude.findByPk(niveauEtudeId, { transaction })
            : null
        const parcoursNom = parcoursData?.type || parcoursData?.titre || 'PARCOURS'
        const niveauNom = niveauEtude?.libelle || 'Niveau'
        const classeNom = classeDerivee.libelle
        const anneeId = demande.session?.anneeAcademiqueId

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

        const [savedCursus] = await CursusApprenant.findOrCreate({
            where: { demandeInscriptionId: demande.id },
            defaults: {
                externe: false,
                intituleParcours: parcoursNom,
                parcoursId: parcoursChoisiFinal?.parcoursId!,
                niveauEtudeId: niveauEtudeId!,
                classeId: classeDerivee.id!,
                anneeAcademiqueId: anneeId!,
                utilisateurId: demande.utilisateurId,
                demandeInscriptionId: demande.id,
            },
            transaction
        })

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
        const echeancesInscription = await GenerateurEcheancierService.generer(
            dossier,
            bordereau.modalite,
            transaction,
            bordereau.montant ?? undefined
        )
        const premiereEcheance = echeancesInscription.find(e => e.numeroEcheance === 1)
        if (premiereEcheance) {
            premiereEcheance.statut = 'paye'
            premiereEcheance.datePaiement = new Date()
            await premiereEcheance.save({ transaction })
        }

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

        if (bordereau.echeanceId) {
            const echeance = await Echeance.findByPk(bordereau.echeanceId, { transaction })
            if (echeance) {
                echeance.dossierEtudiantId = dossier.id
                await echeance.save({ transaction })
            }
        }

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
                        cursusApprenantId: savedCursus.id,
                    },
                    transaction
                })
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
        } else {
            const grille = await TarifService.resoudreParSession(demande.sessionId!, transaction)
            if (grille.montantScolarite && Number(grille.montantScolarite) > 0) {
                await GenerateurEcheancierScolariteService.generer(
                    dossier,
                    { montant: grille.montantScolarite, modalite: grille.modaliteScolarite } as any,
                    transaction
                )
            }
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

        if (demande.dossiersDemande) {
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
                        cursusApprenantId: Number(savedCursus.id)
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

        if (demande.utilisateur) {
            EmailSender.getInstance().sendQuitusEtMatricule(
                demande.utilisateur.identifiant,
                demande.utilisateur.email,
                matricule
            ).catch((err: any) => console.error("Erreur envoi email matricule:", err))
        }
    }
}
