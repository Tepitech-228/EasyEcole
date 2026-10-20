import { isIP } from "net";
import { Request, Response } from "express";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { PointageTerminal } from "../models/PointageTerminal";
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
        etablissementId: terminal.etablissementId,
        actif: terminal.actif,
        lastSeenAt: terminal.lastSeenAt
    };
}

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
            void HikvisionEnrollmentService.enqueueEligibleStudentsForTerminal(terminal).catch(error => {
                console.error(`[Hikvision] Impossible de préparer les enrôlements consentis pour le terminal ${terminal.id}:`, error);
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

    static async updateActive(req: Request, res: Response): Promise<Response> {
        if (!HikvisionTerminalController.adminOnly(req, res)) return res;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0 || typeof req.body?.actif !== "boolean") {
            return res.status(400).json({ success: false, message: "Identifiant ou état du terminal invalide." });
        }
        try {
            const terminal = await PointageTerminal.findOne({ where: { id, protocol: "hikvision_isapi" } });
            if (!terminal) return res.status(404).json({ success: false, message: "Terminal Hikvision non trouvé." });
            await terminal.update({ actif: req.body.actif });
            return res.status(200).json(toClientTerminal(terminal));
        } catch (error) {
            console.error("[Hikvision] terminal status update failed:", error);
            return res.status(500).json({ success: false, message: "L’état du terminal Hikvision n’a pas pu être modifié." });
        }
    }
}
