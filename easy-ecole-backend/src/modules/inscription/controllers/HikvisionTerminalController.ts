import { isIP } from "net";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { PointageTerminal } from "../models/PointageTerminal";
import { PointageTerminalEvent } from "../models/PointageTerminalEvent";
import { HikvisionEnrollment } from "../models/HikvisionEnrollment";
import HikvisionIsapiService from "../services/HikvisionIsapiService";
import HikvisionEnrollmentService from "../services/HikvisionEnrollmentService";

function toClientTerminal(terminal: PointageTerminal): Record<string, unknown> {
    return {
        id: terminal.id,
        serialNumber: terminal.serialNumber,
        nom: terminal.nom,
        sourceIp: terminal.sourceIp,
        protocol: terminal.protocol,
        hikvisionPort: terminal.hikvisionPort,
        hikvisionHttps: terminal.hikvisionHttps,
        // Le mot de passe n'est jamais renvoyé : seulement le compte pour préremplir l'édition.
        username: terminal.hikvisionUsername || null,
        etablissementId: terminal.etablissementId,
        actif: terminal.actif,
        lastSeenAt: terminal.lastSeenAt
    };
}

const TERMINAL_FIELDS = [
    "serialNumber",
    "nom",
    "sourceIp",
    "port",
    "https",
    "username",
    "password",
    "etablissementId",
    "actif"
] as const;

export default class HikvisionTerminalController {
    private static adminOnly(req: Request, res: Response): boolean {
        if (req.utilisateurRole === RolesUtilisateur.ADMIN) return true;
        res.status(403).json({ success: false, message: "Gestion réservée à l’administrateur" });
        return false;
    }

    static async getAll(req: Request, res: Response): Promise<Response> {
        if (!HikvisionTerminalController.adminOnly(req, res)) return res;
        try {
            const terminals = await PointageTerminal.findAll({
                where: { protocol: "hikvision_isapi" },
                order: [["nom", "ASC"]]
            });
            return res.status(200).json(terminals.map(toClientTerminal));
        } catch (error) {
            console.error("[Hikvision] configuration loading failed:", error);
            return res.status(500).json({ success: false, message: "Les terminaux Hikvision n’ont pas pu être chargés." });
        }
    }

    static async create(req: Request, res: Response): Promise<Response> {
        if (!HikvisionTerminalController.adminOnly(req, res)) return res;
        const serialNumber = typeof req.body?.serialNumber === "string" ? req.body.serialNumber.trim() : "";
        const nom = typeof req.body?.nom === "string" ? req.body.nom.trim() : "";
        const sourceIp = typeof req.body?.sourceIp === "string" ? req.body.sourceIp.trim() : "";
        const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";
        const etablissementId = Number(req.body?.etablissementId);
        const port = Number(req.body?.port ?? (req.body?.https ? 443 : 80));
        const https = req.body?.https === true;

        if (
            !/^[A-Za-z0-9._-]{2,64}$/.test(serialNumber) ||
            !nom || nom.length > 120 ||
            isIP(sourceIp) === 0 ||
            !/^[A-Za-z0-9._-]{1,120}$/.test(username) ||
            !password || password.length > 256 ||
            !Number.isSafeInteger(etablissementId) || etablissementId <= 0 ||
            !Number.isSafeInteger(port) || port < 1 || port > 65535
        ) {
            return res.status(400).json({ success: false, message: "Modèle, adresse IP, port, compte, mot de passe ou site invalide." });
        }

        let encryptedPassword: string;
        try {
            encryptedPassword = HikvisionIsapiService.encryptCredential(password);
        } catch (error) {
            console.error("[Hikvision] credential encryption is unavailable:", error);
            return res.status(503).json({ success: false, message: "Configurez ENCRYPTION_MASTER_KEY (64 caractères hexadécimaux) avant d’enregistrer un terminal Hikvision." });
        }

        try {
            const site = await Etablissement.findOne({ where: { id: etablissementId, actif: true } });
            if (!site) return res.status(400).json({ success: false, message: "Le site n’existe pas ou est inactif." });
            const terminal = await PointageTerminal.create({
                serialNumber,
                nom,
                sourceIp,
                etablissementId,
                protocol: "hikvision_isapi",
                hikvisionPort: port,
                hikvisionHttps: https,
                hikvisionUsername: username,
                hikvisionPasswordEncrypted: encryptedPassword,
                actif: true,
                lastSeenAt: null
            });
            void HikvisionEnrollmentService.enqueueEligibleProfilesForTerminal(terminal).catch(error => {
                console.error(`[Hikvision] Impossible de préparer les enrôlements admissibles pour le terminal ${terminal.id}:`, error);
            });
            return res.status(201).json(toClientTerminal(terminal));
        } catch (error) {
            if ((error as { name?: string } | null)?.name === "SequelizeUniqueConstraintError") {
                return res.status(409).json({ success: false, message: "Ce numéro de série est déjà enregistré." });
            }
            console.error("[Hikvision] terminal creation failed:", error);
            return res.status(500).json({ success: false, message: "Le terminal Hikvision n’a pas pu être enregistré." });
        }
    }

    static async testConnection(req: Request, res: Response): Promise<Response> {
        if (!HikvisionTerminalController.adminOnly(req, res)) return res;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: "Identifiant de terminal invalide." });
        try {
            const terminal = await PointageTerminal.findOne({ where: { id, protocol: "hikvision_isapi" } });
            if (!terminal) return res.status(404).json({ success: false, message: "Terminal Hikvision non trouvé." });
            await HikvisionIsapiService.testConnection(terminal);
            return res.status(200).json({ success: true, message: "Connexion ISAPI authentifiée." });
        } catch (error) {
            console.error("[Hikvision] connection test failed:", error);
            const message = error instanceof Error ? error.message : "Le terminal n’a pas pu être joint.";
            return res.status(502).json({ success: false, message });
        }
    }

    /**
     * Réinitialise les enrôlements non terminés pour relancer l'envoi des photos
     * au prochain passage du worker (toutes les minutes).
     */
    private static async resetPendingEnrollments(terminal: PointageTerminal): Promise<void> {
        await HikvisionEnrollment.update(
            {
                statut: "en_attente",
                tentatives: 0,
                prochaineTentativeAt: new Date(),
                derniereErreur: null
            },
            {
                where: {
                    terminalId: terminal.id,
                    statut: { [Op.ne]: "termine" }
                }
            }
        );
    }

    static async update(req: Request, res: Response): Promise<Response> {
        if (!HikvisionTerminalController.adminOnly(req, res)) return res;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: "Identifiant de terminal invalide." });
        }
        const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
            ? req.body as Record<string, unknown>
            : {};
        const providedKeys = TERMINAL_FIELDS.filter(field => body[field] !== undefined);
        if (providedKeys.length === 0) {
            return res.status(400).json({ success: false, message: "Aucune modification fournie." });
        }
        // Rétrocompatibilité : un corps réduit à { actif } reste un simple basculement.
        const toggleOnly = providedKeys.length === 1 && providedKeys[0] === "actif";
        if (toggleOnly && typeof body.actif !== "boolean") {
            return res.status(400).json({ success: false, message: "Identifiant ou état du terminal invalide." });
        }

        try {
            const terminal = await PointageTerminal.findOne({ where: { id, protocol: "hikvision_isapi" } });
            if (!terminal) return res.status(404).json({ success: false, message: "Terminal Hikvision non trouvé." });

            if (toggleOnly) {
                const actif = body.actif as boolean;
                await terminal.update({ actif });
                if (actif) {
                    try {
                        await HikvisionTerminalController.resetPendingEnrollments(terminal);
                    } catch (error) {
                        console.error(`[Hikvision] La file d’enrôlement du terminal ${terminal.id} n’a pas pu être réinitialisée:`, error);
                    }
                }
                return res.status(200).json(toClientTerminal(terminal));
            }

            const serialNumber = body.serialNumber === undefined
                ? undefined
                : typeof body.serialNumber === "string" ? body.serialNumber.trim() : null;
            const nom = body.nom === undefined
                ? undefined
                : typeof body.nom === "string" ? body.nom.trim() : null;
            const sourceIp = body.sourceIp === undefined
                ? undefined
                : typeof body.sourceIp === "string" ? body.sourceIp.trim() : null;
            const username = body.username === undefined
                ? undefined
                : typeof body.username === "string" ? body.username.trim() : null;
            const password = body.password === undefined
                ? undefined
                : typeof body.password === "string" ? body.password : null;
            const port = body.port === undefined ? undefined : Number(body.port);
            const etablissementId = body.etablissementId === undefined ? undefined : Number(body.etablissementId);
            const https = body.https === undefined ? undefined : typeof body.https === "boolean" ? body.https : null;
            const actif = body.actif === undefined ? undefined : typeof body.actif === "boolean" ? body.actif : null;

            if (
                serialNumber === null || (serialNumber !== undefined && !/^[A-Za-z0-9._-]{2,64}$/.test(serialNumber)) ||
                nom === null || (nom !== undefined && (!nom || nom.length > 120)) ||
                sourceIp === null || (sourceIp !== undefined && isIP(sourceIp) === 0) ||
                username === null || (username !== undefined && !/^[A-Za-z0-9._-]{1,120}$/.test(username)) ||
                password === null || (password !== undefined && password.length > 256) ||
                (port !== undefined && (!Number.isSafeInteger(port) || port < 1 || port > 65535)) ||
                (etablissementId !== undefined && (!Number.isSafeInteger(etablissementId) || etablissementId <= 0)) ||
                https === null || actif === null
            ) {
                return res.status(400).json({ success: false, message: "Modèle, adresse IP, port, compte, mot de passe ou état du terminal invalide." });
            }

            const siteChanged = etablissementId !== undefined && etablissementId !== Number(terminal.etablissementId);
            if (etablissementId !== undefined) {
                const site = await Etablissement.findOne({ where: { id: etablissementId, actif: true } });
                if (!site) return res.status(400).json({ success: false, message: "Le site n’existe pas ou est inactif." });
            }

            // Un mot de passe vide (ou absent) ne doit jamais écraser l'identifiant existant.
            let encryptedPassword: string | undefined;
            if (typeof password === "string" && password.length > 0) {
                try {
                    encryptedPassword = HikvisionIsapiService.encryptCredential(password);
                } catch (error) {
                    console.error("[Hikvision] credential encryption is unavailable:", error);
                    return res.status(503).json({ success: false, message: "Configurez ENCRYPTION_MASTER_KEY (64 caractères hexadécimaux) avant d’enregistrer un terminal Hikvision." });
                }
            }

            const previousActif = terminal.actif;
            const identityChanged = encryptedPassword !== undefined
                || (serialNumber !== undefined && serialNumber !== terminal.serialNumber)
                || (sourceIp !== undefined && sourceIp !== terminal.sourceIp)
                || (port !== undefined && port !== terminal.hikvisionPort)
                || (https !== undefined && https !== terminal.hikvisionHttps)
                || (username !== undefined && username !== terminal.hikvisionUsername);

            const updates: {
                serialNumber?: string;
                nom?: string;
                sourceIp?: string;
                etablissementId?: number;
                hikvisionPort?: number;
                hikvisionHttps?: boolean;
                hikvisionUsername?: string;
                hikvisionPasswordEncrypted?: string;
                actif?: boolean;
            } = {};
            if (serialNumber !== undefined) updates.serialNumber = serialNumber;
            if (nom !== undefined) updates.nom = nom;
            if (sourceIp !== undefined) updates.sourceIp = sourceIp;
            if (siteChanged && etablissementId !== undefined) updates.etablissementId = etablissementId;
            if (port !== undefined) updates.hikvisionPort = port;
            if (https !== undefined) updates.hikvisionHttps = https === true;
            if (username !== undefined) updates.hikvisionUsername = username;
            if (encryptedPassword !== undefined) updates.hikvisionPasswordEncrypted = encryptedPassword;
            if (actif !== undefined) updates.actif = actif === true;

            await terminal.update(updates);

            try {
                if (siteChanged) {
                    // Le terminal change de site : les enrôlements en cours pour l'ancien site sont obsolètes.
                    await HikvisionEnrollment.destroy({
                        where: {
                            terminalId: terminal.id,
                            statut: { [Op.ne]: "termine" }
                        }
                    });
                    if (terminal.actif) {
                        void HikvisionEnrollmentService.enqueueEligibleProfilesForTerminal(terminal).catch(error => {
                            console.error(`[Hikvision] Impossible de préparer les enrôlements admissibles pour le terminal ${terminal.id}:`, error);
                        });
                    }
                } else if (identityChanged || (actif === true && !previousActif)) {
                    await HikvisionTerminalController.resetPendingEnrollments(terminal);
                }
            } catch (error) {
                console.error(`[Hikvision] La file d’enrôlement du terminal ${terminal.id} n’a pas pu être mise à jour:`, error);
            }

            return res.status(200).json(toClientTerminal(terminal));
        } catch (error) {
            if ((error as { name?: string } | null)?.name === "SequelizeUniqueConstraintError") {
                return res.status(409).json({ success: false, message: "Ce numéro de série est déjà enregistré." });
            }
            console.error("[Hikvision] terminal update failed:", error);
            return res.status(500).json({ success: false, message: "Le terminal Hikvision n’a pas pu être modifié." });
        }
    }

    /**
     * Suppression définitive d'un terminal Hikvision.
     * Un terminal ayant déjà remonté des pointages est protégé (409) : l'historique
     * ne doit pas être orphelin, la désactivation reste la seule issue.
     */
    static async remove(req: Request, res: Response): Promise<Response> {
        if (!HikvisionTerminalController.adminOnly(req, res)) return res;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: "Identifiant de terminal invalide." });
        }

        try {
            const terminal = await PointageTerminal.findOne({ where: { id, protocol: "hikvision_isapi" } });
            if (!terminal) return res.status(404).json({ success: false, message: "Terminal Hikvision non trouvé." });

            // Garde-fou historique : on refuse la suppression dès qu'un événement référence le terminal.
            const pointagesCount = await PointageTerminalEvent.count({ where: { terminalId: id } });
            if (pointagesCount > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Ce terminal possède des pointages enregistrés. Désactivez-le au lieu de le supprimer."
                });
            }

            // Les attributs sont capturés avant destruction : l'instance détruite ne doit plus servir de source.
            const etablissementId = Number(terminal.etablissementId);
            const terminalId = Number(terminal.id);

            const sequelize = DatabaseConnection.getInstance().sequelize;
            await sequelize.transaction(async transaction => {
                // Les enrôlements du terminal n'ont plus de sens sans lui (pas de pointage associé).
                await HikvisionEnrollment.destroy({ where: { terminalId }, transaction });
                await terminal.destroy({ transaction });
            });

            // Relance des photos sur les autres terminaux du site : le profil doit rester
            // enrôlé ailleurs. Les erreurs sont absorbées pour ne pas masquer une suppression réussie.
            try {
                const remainingTerminals = await PointageTerminal.findAll({
                    where: { etablissementId, protocol: "hikvision_isapi", actif: true }
                });
                for (const remaining of remainingTerminals) {
                    void HikvisionEnrollmentService.enqueueEligibleProfilesForTerminal(remaining).catch(error => {
                        console.error(`[Hikvision] Impossible de préparer les enrôlements admissibles pour le terminal ${remaining.id}:`, error);
                    });
                }
            } catch (error) {
                console.error(`[Hikvision] La relance des enrôlements après suppression du terminal ${terminalId} a échoué:`, error);
            }

            return res.status(200).json({ success: true, message: "Terminal supprimé." });
        } catch (error) {
            console.error("[Hikvision] terminal deletion failed:", error);
            return res.status(500).json({ success: false, message: "Le terminal Hikvision n’a pas pu être supprimé." });
        }
    }
}
