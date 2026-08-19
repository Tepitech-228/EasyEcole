import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { FraisScolarite, estModaliteScolarite } from "../models/FraisScolarite";

export default class FraisScolariteController {

    constructor() { }

    static async getAllFraisScolarite(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<FraisScolarite>> = {}

        try {
            const fraisScolarite: FraisScolarite[] = await FraisScolarite.findAll(options);
            return res.status(200).send(fraisScolarite);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    /**
     * GET par session : renvoie le paramétrage des frais de scolarité d'une
     * session (404 si non paramétré).
     */
    static async getFraisScolariteBySession(req: Request, res: Response): Promise<Response> {
        const sessionId = Number(req.params.sessionId);
        if (!Number.isInteger(sessionId) || sessionId <= 0) {
            return res.status(400).json({ success: false, message: "sessionId invalide" });
        }

        try {
            const fraisScolarite: FraisScolarite | null = await FraisScolarite.findOne({ where: { sessionId } });

            if (fraisScolarite == null)
                return res.status(404).json({ success: false, message: "Frais de scolarité non paramétrés pour cette session" });

            return res.status(200).send(fraisScolarite);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    /**
     * POST (créer/remplacer) : upsert simple du paramétrage de scolarité d'une
     * session. Si un paramétrage existe déjà pour la session (montant/modalité),
     * il est mis à jour — jamais de doublon (contrainte unique sessionId).
     * Écriture réservée à l'administration (INSTITUTION / ADMIN).
     */
    static async upsertFraisScolarite(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (role != RolesUtilisateur.INSTITUTION && role != RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        const { sessionId, montant, modalite, actif } = req.body;

        if (!Number.isInteger(Number(sessionId)) || Number(sessionId) <= 0) {
            return res.status(400).json({ success: false, message: "sessionId requis (entier > 0)" });
        }
        if (typeof montant !== 'number' || !Number.isFinite(montant) || montant <= 0) {
            return res.status(400).json({ success: false, message: "montant requis (nombre > 0)" });
        }
        if (modalite !== undefined && modalite !== null && !estModaliteScolarite(modalite)) {
            return res.status(400).json({ success: false, message: "modalite invalide (doit être '1x', '3x' ou '10x')" });
        }

        try {
            let fraisScolarite: FraisScolarite | null = await FraisScolarite.findOne({ where: { sessionId: Number(sessionId) } });

            if (fraisScolarite != null) {
                // ── Remplacer : mise à jour du paramétrage existant ──
                fraisScolarite.montant = montant;
                fraisScolarite.modalite = estModaliteScolarite(modalite) ? modalite : fraisScolarite.modalite;
                if (typeof actif === 'boolean') fraisScolarite.actif = actif;

                await fraisScolarite.save()
                    .then(async (fraisScolarite) => {
                        return res.status(200).send(fraisScolarite);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
            else {
                // ── Créer : nouveau paramétrage pour la session ──
                fraisScolarite = new FraisScolarite();
                fraisScolarite.sessionId = Number(sessionId);
                fraisScolarite.montant = montant;
                fraisScolarite.modalite = estModaliteScolarite(modalite) ? modalite : '10x';
                fraisScolarite.actif = typeof actif === 'boolean' ? actif : true;

                await fraisScolarite.save()
                    .then(async (fraisScolarite) => {
                        return res.status(201).send(fraisScolarite);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }

        return null
    }
}