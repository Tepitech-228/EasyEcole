import { Request, Response } from "express";
import { ComiteOrientation } from "../models/ComiteOrientation";
import { Utilisateur } from "../models/Utilisateur";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { Cours } from "../../inscription/models/Cours";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Parcours } from "../../inscription/models/Parcours";

export default class ComiteOrientationController {

    constructor() { }

    /**
     * Permet à un membre du comité d'orientation d'ajouter des UE à un étudiant
     * dans un parcours spécifique (en plus de ses UE actuelles).
     */
    static async ajouterUeEtudiant(req: Request, res: Response): Promise<Response> {
        try {
            const { utilisateurId, parcoursId, ueIds } = req.body;

            if (!utilisateurId || !parcoursId || !ueIds || !Array.isArray(ueIds)) {
                return res.status(400).json({
                    success: false,
                    message: "utilisateurId, parcoursId et ueIds (tableau) sont requis"
                });
            }

            // Vérifier que l'étudiant existe
            const etudiant = await Utilisateur.findByPk(utilisateurId);
            if (!etudiant) {
                return res.status(404).json({ success: false, message: "Étudiant non trouvé" });
            }

            // Vérifier que le parcours existe
            const parcours = await Parcours.findByPk(parcoursId);
            if (!parcours) {
                return res.status(404).json({ success: false, message: "Parcours non trouvé" });
            }

            // Vérifier que les UE appartiennent au parcours
            const ueValides = await Cours.findAll({
                where: { id: ueIds, parcoursId }
            });

            if (ueValides.length !== ueIds.length) {
                return res.status(400).json({
                    success: false,
                    message: "Certaines UE n'appartiennent pas au parcours sélectionné"
                });
            }

            // Récupérer ou créer le cursus de l'étudiant pour ce parcours
            let cursus = await CursusApprenant.findOne({
                where: { utilisateurId, parcoursId }
            });

            if (!cursus) {
                cursus = await CursusApprenant.create({
                    utilisateurId,
                    parcoursId,
                    niveauEtudeId: parcours.niveauEtudeId,
                    classeId: null,
                    anneeAcademiqueId: 1, // TODO: récupérer l'année académique active
                    demandeInscriptionId: null
                });
            }

            // Ajouter les UE à l'étudiant (éviter les doublons)
            const resultats = [];
            for (const ueId of ueIds) {
                const [coursParticipant, created] = await CoursParticipant.findOrCreate({
                    where: { utilisateurId, coursId: ueId },
                    defaults: {
                        utilisateurId,
                        coursId: ueId,
                        cursusApprenantId: cursus.id
                    }
                });

                resultats.push({
                    ueId,
                    created,
                    message: created ? "UE ajoutée" : "UE déjà assignée"
                });
            }

            // Récupérer la liste mise à jour des UE de l'étudiant
            const ueMaj = await CoursParticipant.findAll({
                where: { utilisateurId },
                include: [{ association: CoursParticipant.associations.cours }]
            });

            return res.status(200).json({
                success: true,
                message: `${resultats.filter(r => r.created).length} UE ajoutée(s) à l'étudiant`,
                resultats,
                ue: ueMaj
            });
        } catch (error) {
            console.error('Erreur ajout UE étudiant:', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getProfile(req: Request, res: Response): Promise<Response> {
        try {
            const membre = await ComiteOrientation.findOne({
                where: { utilisateurId: (req as any).utilisateurId },
                include: [ComiteOrientation.associations.utilisateur]
            })

            if (!membre) {
                return res.status(404).json({ success: false, message: "Membre du comité non trouvé" })
            }

            return res.status(200).send(membre)
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async updateProfile(req: Request, res: Response): Promise<Response | null> {
        try {
            let membre = await ComiteOrientation.findOne({
                where: { utilisateurId: (req as any).utilisateurId }
            })

        if (membre) {
            await membre.update({ fonction: req.body.fonction, estPrescripteur: req.body.estPrescripteur })
        } else {
            membre = await ComiteOrientation.create({
                utilisateurId: (req as any).utilisateurId,
                fonction: req.body.fonction,
                estPrescripteur: req.body.estPrescripteur || false
            })
        }

            return res.status(200).send(membre)
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
