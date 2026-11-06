import express from "express";
import { Op, Transaction } from "sequelize";
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
import { CarteData, GenerateurCarteService } from "../services/GenerateurCarteService";
import { DossierStorageService } from "../services/DossierStorageService";
import { resolveStoredDocumentPath } from "../../../core/services/DocumentStorageService";
import { FolderAutoService } from "../../ged/services/FolderAutoService";
import { GenerateurEcheancierService, estModalitePaiement } from "../services/GenerateurEcheancierService";
import { GenerateurEcheancierScolariteService } from "../services/GenerateurEcheancierScolariteService";
import { nombreEcheances } from "../services/GenerateurEcheancierSessionService";
import { SnapshotService } from "../services/SnapshotService";
import { TarifService } from "../services/TarifService";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import { DemandeDocument } from "../../scolarite/models/DemandeDocument";
import { TypeDocument } from "../../scolarite/models/TypeDocument";
import { DocGenGeneratorService } from "../../docgen/services/DocGenGeneratorService";
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

export interface CarteEtudiantDifferee {
    dossierId: number;
    data: CarteData;
    rangement?: {
        anneeAcademique: string;
        parcours: string;
        classe: string;
        niveau: string;
        matricule: string;
    };
}

export interface AutorisationProvisoireDifferee {
    demandeDocumentId: number;
    utilisateurId: number;
    cursusApprenantId: number;
    demandeInscriptionId: number;
    anneeAcademiqueId?: number | null;
    parcoursId?: number | null;
    niveauEtudeId?: number | null;
    initialesComite?: string;
}

export interface DossierEtudiantDiffere {
    anneeAcademique: string;
    parcours: string;
    classe: string;
    niveau: string;
    matricule: string;
    anneeAcademiqueId: number | null;
    utilisateurId: number;
}

export class BordereauDossierService {

    private static async finaliserDossierElearning(
        demande: DemandeInscription,
        req: any,
        transaction: Transaction,
    ): Promise<{ matricule: string; carteEtudiant?: CarteEtudiantDifferee }> {
        const utilisateurId = Number(demande.utilisateurId);
        const siteId = Number(demande.etablissementId || req.etablissementId || 0);
        if (!Number.isSafeInteger(siteId) || siteId <= 0) {
            throw new Error("Un site d'inscription est requis pour finaliser le dossier e-learning.");
        }

        const etablissement = await Etablissement.findByPk(siteId, { transaction });
        if (!etablissement) throw new Error("Le site d'inscription e-learning est introuvable.");
        const anneeLibelle = demande.session?.anneeAcademique?.libelle || new Date().getFullYear().toString();
        const anneeCode = anneeLibelle.replace(/[^0-9]/g, "").slice(-2) || String(new Date().getFullYear()).slice(-2);
        const matriculeSaisi = demande.typeDemande === "reinscription"
            ? ""
            : String(demande.matriculeEtudiant || "").trim();
        if (demande.typeDemande !== "reinscription" && !matriculeSaisi) {
            throw new Error("Un matricule étudiant doit être renseigné avant la validation du dossier.");
        }
        if (matriculeSaisi) {
            const matriculeDejaAttribue = await DossierEtudiant.findOne({
                where: { matricule: matriculeSaisi, utilisateurId: { [Op.ne]: utilisateurId } },
                paranoid: false,
                transaction,
            });
            if (matriculeDejaAttribue) {
                throw new Error("Le matricule étudiant proposé est déjà attribué à un autre étudiant.");
            }
        }
        const existingFinal = typeof demande.matricule === "string"
            && /^[0-9]+-EL1J-[0-9]{2}-[A-Z]+$/.test(demande.matricule);
        const matricule = matriculeSaisi || (existingFinal
            ? demande.matricule
            : `${await DossierEtudiant.prochainOrdreMatricule(transaction)}-EL1J-${anneeCode}-${IDGenerator.deriveSiteCode(etablissement)}`);

        await demande.update({ matricule, dateValidation: new Date() }, { transaction });
        for (const paiement of (demande.paiementsInscription || [])) {
            if (paiement.matriculeInscription && paiement.matriculeInscription !== matricule) {
                await paiement.update({ matriculeInscription: matricule }, { transaction });
            }
        }

        let dossier = await DossierEtudiant.findOne({
            where: { utilisateurId },
            order: [["id", "DESC"]],
            transaction,
        });
        const dossierValues = {
            matricule,
            etablissementId: siteId,
            codeQR: JSON.stringify({ matricule, utilisateurId }),
            statut: "actif" as const,
        };
        if (dossier) {
            if (dossier.etablissementId && Number(dossier.etablissementId) !== siteId) {
                throw new Error("Le dossier étudiant appartient à un autre site.");
            }
            await dossier.update(dossierValues, { transaction });
        } else {
            dossier = await DossierEtudiant.create({
                utilisateurId,
                ...dossierValues,
                statut: "actif",
                fraisScolarite: 0,
                modePaiement: "mensuel",
                nbMensualites: 10,
                demarrageParcours: demande.createdAt || new Date(),
            }, { transaction });
        }

        const user = demande.utilisateur as any;
        const apprenant = user?.apprenant;
        const carteEtudiant: CarteEtudiantDifferee = {
            dossierId: Number(dossier.id),
            data: {
                nom: user?.nom || "",
                prenom: user?.prenoms || "",
                matricule,
                dateNaissance: String(apprenant?.dateNaissance || ""),
                photo: apprenant?.photo || dossier.photo || undefined,
                classe: "E-learning",
                filiere: "E-learning",
                anneeAcademique: anneeLibelle,
                email: user?.email || "",
                utilisateurId,
            },
        };

        if (demande.utilisateur) {
            EmailSender.getInstance().sendQuitusEtMatricule(
                demande.utilisateur.identifiant,
                demande.utilisateur.email,
                matricule,
            ).catch((error: any) => console.error("Erreur envoi matricule e-learning:", error));
        }
        return { matricule, carteEtudiant };
    }

    static async genererCarteEtudiantDifferee(carteEtudiant: CarteEtudiantDifferee): Promise<void> {
        const cartePath = await GenerateurCarteService.generer(carteEtudiant.data);
        const dossier = await DossierEtudiant.findByPk(carteEtudiant.dossierId);
        if (!dossier) {
            throw new Error(`Dossier étudiant ${carteEtudiant.dossierId} introuvable après génération de la carte.`);
        }
        await dossier.update({ cartePath, carteGeneree: true });

        if (carteEtudiant.rangement) {
            const carteSource = resolveStoredDocumentPath(cartePath, [
                process.cwd(),
                path.resolve(process.cwd(), 'public'),
            ]);
            if (carteSource) {
                const rangement = carteEtudiant.rangement;
                DossierStorageService.copierFichier(
                    carteSource,
                    rangement.anneeAcademique,
                    rangement.parcours,
                    rangement.classe,
                    rangement.niveau,
                    rangement.matricule,
                    'cartes',
                );
            }
        }
    }

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
        const parcoursElearning = demande.modeFormation === 'en_ligne'
        const pedagogieDifferee = options?.pedagogieDifferee === true || parcoursElearning
        if ((!demande.parcoursChoisis || demande.parcoursChoisis.length === 0) && !parcoursElearning) {
            throw new Error("Aucun parcours choisi")
        }

        // Période de cours + admission : vérifiés/posés à la FINALISATION (comité)
        // lorsque la pédagogie est différée.
        let typeCoursPeriode: 'jour' | 'soir' = 'jour'
        if (!pedagogieDifferee) {
            const periodeEtudiant = demande.modeFormation === 'en_ligne'
                ? 'en_ligne'
                : demande.utilisateur?.apprenant?.periode
            if (periodeEtudiant !== 'matin' && periodeEtudiant !== 'soir' && periodeEtudiant !== 'en_ligne') {
                throw new Error("L'étudiant doit renseigner sa période (cours du matin, du soir ou en ligne) dans ses informations personnelles avant validation")
            }
            if (demande.modeFormation === 'en_ligne' && demande.utilisateur?.apprenant && demande.utilisateur.apprenant.periode !== 'en_ligne') {
                await demande.utilisateur.apprenant.update({ periode: 'en_ligne' }, { transaction })
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
        if (!hasChoixFinal(demande.parcoursChoisis) && !parcoursElearning) {
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

        const parcoursFinalForCursus: any = getParcoursFinal(demande.parcoursChoisis)

        const anneeLibelle = demande.session?.anneeAcademique?.libelle || new Date().getFullYear().toString()
        const parcoursData: any = parcoursFinalForCursus?.parcours

        // Classe bannie du matricule : on ne cherche plus la classe, uniquement la filière
        const classeDerivee: any = null

        const etablissementId = parcoursData?.etablissementId ?? (parcoursElearning ? (demande.etablissementId ?? bordereau.etablissementId) : null)
        if (etablissementId && bordereau.etablissementId && etablissementId !== bordereau.etablissementId) {
            throw new Error("Le bordereau et le parcours ne relèvent pas du même site")
        }
        const siteDossierId = etablissementId ?? bordereau.etablissementId ?? null
        const etablissement = etablissementId
            ? await Etablissement.findByPk(etablissementId, { transaction })
            : null

        const MATRICULE_FINAL_REGEX = /^[0-9]+-[A-Z]+[0-9]?[JS]-[0-9]{2}-[A-Z]+$/
        const matriculeExistant = demande.matricule
        const estFormatFinal = typeof matriculeExistant === 'string'
            && MATRICULE_FINAL_REGEX.test(matriculeExistant)
        const matriculeEtudiantSaisi = demande.typeDemande === 'reinscription'
            ? ''
            : String(demande.matriculeEtudiant || '').trim()
        if (demande.typeDemande !== 'reinscription' && !matriculeEtudiantSaisi) {
            throw new Error("Un matricule étudiant doit être renseigné avant la validation du dossier.")
        }
        if (matriculeEtudiantSaisi) {
            const utilisateurId = Number(demande.utilisateurId)
            const matriculeDejaAttribue = await DossierEtudiant.findOne({
                where: { matricule: matriculeEtudiantSaisi, utilisateurId: { [Op.ne]: utilisateurId } },
                paranoid: false,
                transaction,
            })
            if (matriculeDejaAttribue) {
                throw new Error("Le matricule étudiant proposé est déjà attribué à un autre étudiant.")
            }
        }

        let matricule: string
        if (pedagogieDifferee) {
            // Pédagogie différée : le matricule FINAL sera généré par la validation
            // du comité (finaliserAffectationPedagogique). On utilise ici le
            // matricule temporaire de la demande (NOT NULL) pour satisfaire les FK.
            matricule = demande.matricule
        } else if (matriculeEtudiantSaisi) {
            matricule = matriculeEtudiantSaisi
            await demande.update({ matricule, dateValidation: new Date() }, { transaction })
        } else if (estFormatFinal) {
            matricule = matriculeExistant
        } else {
            const ordre = await DossierEtudiant.prochainOrdreMatricule(transaction)
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

        const niveauEtudeId = parcoursData?.niveauEtudeId ?? classeDerivee?.niveauEtudeId ?? (parcoursElearning ? demande.session?.niveauEtudeId : null)
        const niveauEtude = niveauEtudeId
            ? await NiveauEtude.findByPk(niveauEtudeId, { transaction })
            : null
        const parcoursNom = parcoursElearning ? 'E-LEARNING' : (parcoursData?.type || parcoursData?.titre || 'PARCOURS')
        const niveauNom = niveauEtude?.libelle || 'Niveau'
        const classeNom = classeDerivee?.libelle ?? 'À affecter'
        const anneeId = demande.session?.anneeAcademiqueId

        if (!pedagogieDifferee) {
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
        if (!pedagogieDifferee) {
            const [savedCursus] = await CursusApprenant.findOrCreate({
                where: { demandeInscriptionId: demande.id },
                defaults: {
                    externe: false,
                    etablissementId: siteDossierId,
                    intituleParcours: parcoursNom,
                    parcoursId: parcoursChoisiFinal?.parcoursId!,
                    niveauEtudeId: niveauEtudeId!,
                    classeId: (classeDerivee as any)?.id ?? null,
                    anneeAcademiqueId: anneeId!,
                    utilisateurId: demande.utilisateurId,
                    demandeInscriptionId: demande.id,
                },
                transaction
            })
            savedCursusId = savedCursus.id
            if (savedCursus.etablissementId && siteDossierId && savedCursus.etablissementId !== siteDossierId) {
                throw new Error("Le cursus étudiant appartient à un autre site")
            }
            if (!savedCursus.etablissementId && siteDossierId) {
                await savedCursus.update({ etablissementId: siteDossierId }, { transaction })
            }
        }

        const demarrage = parcoursChoisiFinal?.createdAt || demande.createdAt || new Date()
        let dossier = await DossierEtudiant.findOne({ where: { matricule } })
        if (!dossier) {
            const codeQR = JSON.stringify({ matricule, utilisateurId: bordereau.utilisateurId })
            dossier = new DossierEtudiant()
            dossier.utilisateurId = bordereau.utilisateurId
            dossier.etablissementId = siteDossierId
            dossier.matricule = matricule
            dossier.codeQR = codeQR
            dossier.statut = pedagogieDifferee && parcoursElearning ? 'suspendu' : 'actif'
            dossier.fraisScolarite = fraisTotal
            dossier.modePaiement = 'mensuel'
            dossier.nbMensualites = 10
            dossier.demarrageParcours = demarrage
            await dossier.save({ transaction })
        } else if (dossier.etablissementId && siteDossierId && dossier.etablissementId !== siteDossierId) {
            throw new Error("Le dossier étudiant appartient à un autre site")
        } else if (!dossier.etablissementId && siteDossierId) {
            dossier.etablissementId = siteDossierId
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

        if (!pedagogieDifferee) {
            try {
                const user = demande.utilisateur as any
                const apprenant = user?.apprenant
                const cartePath = await GenerateurCarteService.generer({
                    nom: user?.nom || '',
                    prenom: user?.prenoms || '',
                    matricule: matricule,
                    dateNaissance: String(apprenant?.dateNaissance || ''),
                    photo: apprenant?.photo || dossier.photo || undefined,
                    classe: parcoursNom,
                    filiere: classeNom,
                    anneeAcademique: anneeLibelle,
                    email: user?.email || '',
                    utilisateurId: demande.utilisateurId,
                })
                await dossier.update({ cartePath, carteGeneree: true }, { transaction })

                const carteSource = resolveStoredDocumentPath(cartePath, [
                    process.cwd(),
                    path.resolve(process.cwd(), 'public'),
                ])
                if (carteSource) {
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

        if (!pedagogieDifferee) {
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
        if (fraisScolariteSession && !parcoursElearning) {
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

        // L'archivage GED est TRAÇABLE mais JAMAIS bloquant : une erreur GED
        // (compte utilisateur absent, répertoire illisible, FK…) ne doit pas
        // annuler la création du dossier étudiant ni la saisie du bordereau.
        const uploaderIdGED = Number((req as any)?.utilisateurId) || undefined

        if (demande.dossiersDemande && savedCursusId) {
            for (const doc of demande.dossiersDemande) {
                try {
                    await ArchiveGedService.archiverDocumentInscription(
                        Number(demande.id),
                        doc.nomFichier,
                        {
                            titre: `Dossier inscription - ${matricule}`,
                            anneeAcademiqueId: Number(demande.session?.anneeAcademiqueId!),
                            parcoursId: Number(parcoursChoisiFinal?.parcoursId!),
                            niveauEtudeId: Number(parcoursChoisiFinal?.parcours?.niveauEtudeId!),
                            classeId: undefined,
                            cursusApprenantId: Number(savedCursusId),
                            uploaderId: uploaderIdGED
                        }
                    )
                } catch (gedError) {
                    console.warn('[GED][non-bloquant]', 'archivage dossier inscription', gedError)
                }
            }
        }

        if (bordereau.fichier && !parcoursElearning) {
            try {
                await ArchiveGedService.archiverBordereau(
                    Number(bordereau.id),
                    bordereau.fichier,
                    {
                        titre: `Bordereau ${bordereau.type} - ${bordereau.referenceBancaire || bordereau.id}`,
                        anneeAcademiqueId: Number(demande.session?.anneeAcademiqueId!),
                        parcoursId: Number(parcoursChoisiFinal?.parcoursId!),
                        niveauEtudeId: Number(parcoursChoisiFinal?.parcours?.niveauEtudeId!),
                        uploaderId: uploaderIdGED
                    }
                )
            } catch (gedError) {
                console.warn('[GED][non-bloquant]', 'archivage bordereau', gedError)
            }
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

        if (!pedagogieDifferee && demande.utilisateur) {
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
        options: { initialesComite?: string } = {},
    ): Promise<{
        matricule: string;
        carteEtudiant?: CarteEtudiantDifferee;
        autorisation?: AutorisationProvisoireDifferee;
        dossierEtudiantDiffere?: DossierEtudiantDiffere;
    }> {
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

        const periodeEtudiant = demande.modeFormation === 'en_ligne'
            ? 'en_ligne'
            : demande.utilisateur?.apprenant?.periode
        if (periodeEtudiant !== 'matin' && periodeEtudiant !== 'soir' && periodeEtudiant !== 'en_ligne') {
            throw new Error("L'étudiant doit renseigner sa période (cours du matin, du soir ou en ligne) dans ses informations personnelles avant validation")
        }
        // Le mode 'en_ligne' est porté par la demande (source de vérité) et
        // répercuté sur le profil : la génération du matricule et les écrans
        // historiques continuent de lire `aut_apprenants.periode`.
        if (demande.modeFormation === 'en_ligne' && demande.utilisateur?.apprenant && demande.utilisateur.apprenant.periode !== 'en_ligne') {
            await demande.utilisateur.apprenant.update({ periode: 'en_ligne' }, { transaction })
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

        if (demande.modeFormation === "en_ligne") {
            return this.finaliserDossierElearning(demande, req, transaction);
        }

        const parcoursFinal = getParcoursFinal(demande.parcoursChoisis)
        const parcoursData = parcoursFinal?.parcours

        const coursDuParcours = parcoursFinal?.parcoursId
            ? await Cours.findAll({ where: { parcoursId: parcoursFinal.parcoursId }, include: [Cours.associations.classe] })
            : []
        const classeDerivee = coursDuParcours.find(c => c.classe?.id)?.classe ?? null
        // Option A (comité) : l'absence de classe ne bloque PAS la validation.
        // L'étudiant est validé (matricule définitif, dossier actif) avec une classe
        // "À affecter" ; la création du cursus est reportée tant que la classe n'est
        // pas affectée (CursusApprenant.classeId étant NOT NULL en base, on ne peut
        // pas créer un cursus sans classe).

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
        const etablissementId = parcoursData?.etablissementId ?? classeDerivee?.etablissementId
        const etablissement = etablissementId ? await Etablissement.findByPk(etablissementId, { transaction }) : null

        const MATRICULE_FINAL_REGEX = /^[0-9]+-[A-Z]+[0-9]?[JS]-[0-9]{2}-[A-Z]+$/
        const matriculeSaisi = demande.typeDemande === 'reinscription'
            ? ''
            : String(demande.matriculeEtudiant || '').trim()
        if (demande.typeDemande !== 'reinscription' && !matriculeSaisi) {
            throw new Error("Un matricule étudiant doit être renseigné avant la validation du dossier.")
        }
        if (matriculeSaisi) {
            const matriculeDejaAttribue = await DossierEtudiant.findOne({
                where: { matricule: matriculeSaisi, utilisateurId: { [Op.ne]: utilisateurId } },
                paranoid: false,
                transaction,
            })
            if (matriculeDejaAttribue) {
                throw new Error("Le matricule étudiant proposé est déjà attribué à un autre étudiant.")
            }
        }
        let matricule: string
        if (matriculeSaisi) {
            matricule = matriculeSaisi
            await demande.update({ matricule, dateValidation: new Date() }, { transaction })
        } else if (typeof demande.matricule === 'string' && MATRICULE_FINAL_REGEX.test(demande.matricule)) {
            matricule = demande.matricule
        } else {
            const ordre = await DossierEtudiant.prochainOrdreMatricule(transaction)
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
        const siteDossierId = etablissementId ?? null
        let dossier = await DossierEtudiant.findOne({
            where: { utilisateurId, ...(siteDossierId ? { etablissementId: siteDossierId } : {}) },
            order: [['id', 'DESC']],
            transaction,
        })
        if (!dossier) {
            // Invariant métier : tout apprenant validé (admis) DOIT posséder un
            // dossier étudiant. La finalisation est le moment officiel de création :
            // si le socle financier n'a pas été posé en amont (absence de bordereau),
            // on crée ici le dossier pour ne jamais laisser un étudiant sans dossier.
            const codeQR = JSON.stringify({ matricule, utilisateurId })
            dossier = await DossierEtudiant.create({
                utilisateurId,
                etablissementId: siteDossierId,
                matricule,
                codeQR,
                statut: 'actif',
                fraisScolarite: 0,
                modePaiement: 'mensuel',
                nbMensualites: 10,
                demarrageParcours: (parcoursFinal as any)?.createdAt || demande.createdAt || new Date(),
            }, { transaction })
        } else if (dossier.matricule !== matricule) {
            await dossier.update({ matricule, etablissementId: siteDossierId ?? dossier.etablissementId }, { transaction })
        } else if (!dossier.etablissementId && siteDossierId) {
            await dossier.update({ etablissementId: siteDossierId }, { transaction })
        }

        const niveauEtudeId = parcoursData?.niveauEtudeId
            ?? classeDerivee?.niveauEtudeId
            ?? demande.session?.niveauEtudeId
        if (!niveauEtudeId) {
            throw new Error("Aucun niveau d'étude n'est associé au parcours, à la classe ou à la session de la demande.")
        }
        const niveauEtude = niveauEtudeId ? await NiveauEtude.findByPk(niveauEtudeId, { transaction }) : null
        const parcoursNom = parcoursData?.type || parcoursData?.titre || 'PARCOURS'
        const niveauNom = niveauEtude?.libelle || 'Niveau'
        const classeNom = classeDerivee?.libelle ?? 'À affecter'
        const anneeId = demande.session?.anneeAcademiqueId

        // Création systématique du cursus : l'étudiant DOIT avoir son cursus
        // (parcours + niveau + année) à la validation finale, même si aucune
        // classe n'est encore affectée (classeId = null, à mettre à jour
        // lors de l'affectation pédagogique ultérieure).
        let savedCursusId: number | null = null
        const [savedCursus] = await CursusApprenant.findOrCreate({
            where: { demandeInscriptionId: demande.id },
            defaults: {
                externe: false,
                etablissementId: siteDossierId,
                intituleParcours: parcoursNom,
                parcoursId: parcoursFinal!.parcoursId!,
                niveauEtudeId: niveauEtudeId!,
                classeId: classeDerivee?.id ?? null,
                anneeAcademiqueId: anneeId!,
                utilisateurId: demande.utilisateurId,
                demandeInscriptionId: demande.id,
            },
            transaction
        })
        savedCursusId = savedCursus.id
        if (savedCursus.etablissementId && siteDossierId && savedCursus.etablissementId !== siteDossierId) {
            throw new Error("Le cursus étudiant appartient à un autre site")
        }
        if (!savedCursus.etablissementId && siteDossierId) {
            await savedCursus.update({ etablissementId: siteDossierId }, { transaction })
        }

        // L'autorisation provisoire est un livrable gratuit de la finalisation.
        // Le PDF est généré APRÈS le commit (setImmediate côté contrôleur) pour ne pas
        // bloquer la validation du comité pendant le rendu Chromium.
        // La recherche préalable rend l'opération idempotente en cas de reprise.
        const [typeAutorisation] = await TypeDocument.findOrCreate({
            where: { libelle: "Autorisation provisoire d'inscription" },
            defaults: {
                libelle: "Autorisation provisoire d'inscription",
                frais: 0,
                categorie: 'inscription',
                paiementObligatoire: false,
                generationAuto: true,
                actif: true,
            },
            transaction,
        });
        const autorisationExistante = await DemandeDocument.findOne({
            where: {
                etudiantId: demande.utilisateurId,
                typeDocumentId: typeAutorisation.id,
                source: 'automatique',
                anneeAcademiqueId: anneeId,
                parcoursId: parcoursFinal?.parcoursId ?? null,
            },
            transaction,
        });
        const documentDejaPret = Boolean(autorisationExistante?.numeroDemande && autorisationExistante?.fichierPDF);
        const documentValues = {
            statut: documentDejaPret ? autorisationExistante!.statut : 'en_preparation',
            fraisPayes: true,
            source: 'automatique',
            montant: 0,
            parcoursId: parcoursFinal?.parcoursId ?? null,
            niveauEtudeId: niveauEtudeId ?? null,
            classeId: classeDerivee?.id ?? null,
            anneeAcademiqueId: anneeId ?? null,
            datePreparation: autorisationExistante?.datePreparation || new Date(),
        };
        let autorisationDocument: DemandeDocument;
        if (autorisationExistante) {
            await autorisationExistante.update(documentValues, { transaction });
            autorisationDocument = autorisationExistante;
        } else {
            autorisationDocument = await DemandeDocument.create({
                etudiantId: demande.utilisateurId,
                typeDocumentId: typeAutorisation.id,
                ...documentValues,
            } as any, { transaction });
        }
        const autorisationDifferee: AutorisationProvisoireDifferee | undefined = autorisationDocument.id
            ? {
                demandeDocumentId: Number(autorisationDocument.id),
                utilisateurId: Number(demande.utilisateurId),
                cursusApprenantId: Number(savedCursus.id),
                demandeInscriptionId: Number(demande.id),
                anneeAcademiqueId: anneeId ?? null,
                parcoursId: parcoursFinal?.parcoursId ?? null,
                niveauEtudeId: niveauEtudeId ?? null,
                initialesComite: options.initialesComite,
            }
            : undefined;

        if (!classeDerivee?.id) {
            console.info(`[AffectationPédagogique] Cursus créé sans classe affectée (utilisateur ${utilisateurId}) : à affecter ultérieurement.`)
        }

        if (savedCursusId) {
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
        }

        let carteEtudiant: CarteEtudiantDifferee | undefined;
        if (dossier) {
            const user = demande.utilisateur as any
            const apprenant = user?.apprenant
            carteEtudiant = {
                dossierId: Number(dossier.id),
                data: {
                    nom: user?.nom || '',
                    prenom: user?.prenoms || '',
                    matricule,
                    dateNaissance: String(apprenant?.dateNaissance || ''),
                    photo: apprenant?.photo || dossier.photo || undefined,
                    classe: parcoursNom,
                    filiere: classeNom,
                    anneeAcademique: anneeLibelle,
                    email: user?.email || '',
                    utilisateurId: demande.utilisateurId,
                },
                rangement: {
                    anneeAcademique: anneeLibelle,
                    parcours: parcoursNom,
                    classe: classeNom,
                    niveau: niveauNom,
                    matricule,
                },
            };
        }

        if (demande.utilisateur) {
            EmailSender.getInstance().sendQuitusEtMatricule(
                demande.utilisateur.identifiant,
                demande.utilisateur.email,
                matricule
            ).catch((err: any) => console.error("Erreur envoi email matricule:", err))
        }

        return {
            matricule,
            carteEtudiant,
            autorisation: autorisationDifferee,
            dossierEtudiantDiffere: {
                anneeAcademique: anneeLibelle,
                parcours: parcoursNom,
                classe: classeNom,
                niveau: niveauNom,
                matricule,
                anneeAcademiqueId: anneeId ? Number(anneeId) : null,
                utilisateurId: Number((req as any).utilisateurId),
            },
        }
    }

    static async preparerDossierEtudiantDiffere(dossier: DossierEtudiantDiffere): Promise<void> {
        try {
            DossierStorageService.creerDossierEtudiant(
                dossier.anneeAcademique,
                dossier.parcours,
                dossier.classe,
                dossier.niveau,
                dossier.matricule,
            )
        } catch (error) {
            console.error("Erreur création dossier étudiant:", error)
        }

        if (dossier.anneeAcademiqueId) {
            try {
                await FolderAutoService.creerDossierMatricule({
                    anneeAcademiqueId: dossier.anneeAcademiqueId,
                    parcoursNom: dossier.parcours,
                    classeNom: dossier.classe,
                    niveauNom: dossier.niveau,
                    matricule: dossier.matricule,
                    utilisateurId: dossier.utilisateurId,
                })
            } catch (error) {
                console.error("Erreur création dossier GED matricule:", error)
            }
        }
    }

    static async genererAutorisationProvisoireDifferee(
        autorisation: AutorisationProvisoireDifferee,
        req: any,
    ): Promise<void> {
        const result = await DocGenGeneratorService.generer({
            typeCode: 'API001',
            sourceType: 'cursus_apprenant',
            sourceId: autorisation.cursusApprenantId,
            utilisateurId: Number((req as any).utilisateurId),
            params: {
                demandeInscriptionId: autorisation.demandeInscriptionId,
                cursusApprenantId: autorisation.cursusApprenantId,
                etudiantId: autorisation.utilisateurId,
                anneeAcademiqueId: autorisation.anneeAcademiqueId ?? undefined,
                parcoursId: autorisation.parcoursId ?? undefined,
                niveauEtudeId: autorisation.niveauEtudeId ?? undefined,
                initialesComite: autorisation.initialesComite,
            },
        }, req);
        await DemandeDocument.update({
            statut: 'document_pret',
            fraisPayes: true,
            source: 'automatique',
            montant: 0,
            numeroDemande: result.reference,
            dateGeneration: new Date(),
            fichierPDF: result.filePath,
        }, { where: { id: autorisation.demandeDocumentId } });
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
