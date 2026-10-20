import { createHash } from "crypto";
import { isIP } from "net";
import { Request, Response } from "express";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Pointage } from "../models/Pointage";
import { PointageScan } from "../models/PointageScan";
import { PointageTerminal } from "../models/PointageTerminal";
import { PointageTerminalEvent } from "../models/PointageTerminalEvent";
import { VerificationPaiementService } from "../services/VerificationPaiementService";

interface AttendanceLog {
    pin: string;
    date: string;
    time: string;
    statusCode: number;
    verifyType: number;
    utilisateurId?: number;
    eventId?: number;
}

function normalizedIp(ip: string): string {
    return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

function parseAttendanceLogs(body: string): AttendanceLog[] | null {
    const lines = body.split(/\r\n|\r|\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length > 1000) return null;
    const events: AttendanceLog[] = [];

    for (const line of lines) {
        const fields = line.split("\t");
        if (fields.length < 4 || !fields[0] || fields[0].length > 64) return null;
        const timestamp = fields[1].trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
        const statusCode = Number(fields[2]);
        const verifyType = Number(fields[3]);
        if (!timestamp || !Number.isSafeInteger(statusCode) || !Number.isSafeInteger(verifyType)) return null;

        const [, year, month, day, hour, minute, second] = timestamp;
        const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
        if (
            parsedDate.getUTCFullYear() !== Number(year)
            || parsedDate.getUTCMonth() !== Number(month) - 1
            || parsedDate.getUTCDate() !== Number(day)
            || Number(hour) > 23
            || Number(minute) > 59
            || Number(second) > 59
        ) return null;

        events.push({
            pin: fields[0].trim(),
            date: `${year}-${month}-${day}`,
            time: `${hour}:${minute}:${second}`,
            statusCode,
            verifyType
        });
    }

    return events;
}

function estErreurUnique(error: unknown): boolean {
    return (error as { name?: string } | null)?.name === "SequelizeUniqueConstraintError";
}

export default class PointageTerminalController {
    private static adminOnly(req: Request, res: Response): boolean {
        if (req.utilisateurRole === RolesUtilisateur.ADMIN) return true;
        res.status(403).json({ success: false, message: "Gestion réservée à l’administrateur" });
        return false;
    }

    private static async terminalAutorise(req: Request): Promise<PointageTerminal | null> {
        const serialNumber = typeof req.query.SN === "string" ? req.query.SN.trim() : "";
        if (!serialNumber) return null;
        const terminal = await PointageTerminal.findOne({ where: { serialNumber, protocol: "zkteco_adms", actif: true } });
        if (!terminal || normalizedIp(req.ip || "") !== terminal.sourceIp) return null;
        await terminal.update({ lastSeenAt: new Date() });
        return terminal;
    }

    private static repondreProtocole(res: Response, body: string): Response {
        return res.status(200).type("text/plain").send(body);
    }

    static async getTerminaux(req: Request, res: Response): Promise<Response> {
        if (!PointageTerminalController.adminOnly(req, res)) return res;
        try {
            const terminaux = await PointageTerminal.findAll({
                where: { protocol: "zkteco_adms" },
                order: [["nom", "ASC"]]
            });
            return res.status(200).json(terminaux);
        } catch (error) {
            console.error("[PointageTerminal] erreur de chargement des terminaux:", error);
            return res.status(500).json({ success: false, message: "Les terminaux n’ont pas pu être chargés." });
        }
    }

    static async creerTerminal(req: Request, res: Response): Promise<Response> {
        if (!PointageTerminalController.adminOnly(req, res)) return res;
        const serialNumber = typeof req.body?.serialNumber === "string" ? req.body.serialNumber.trim() : "";
        const nom = typeof req.body?.nom === "string" ? req.body.nom.trim() : "";
        const sourceIp = typeof req.body?.sourceIp === "string" ? normalizedIp(req.body.sourceIp.trim()) : "";
        const etablissementId = Number(req.body?.etablissementId);
        if (!/^[A-Za-z0-9._-]{2,64}$/.test(serialNumber) || !nom || nom.length > 120 || isIP(sourceIp) === 0
            || !Number.isSafeInteger(etablissementId) || etablissementId <= 0) {
            return res.status(400).json({ success: false, message: "Numéro de série, nom, IP autorisée ou site invalide." });
        }
        try {
            const site = await Etablissement.findOne({ where: { id: etablissementId, actif: true } });
            if (!site) return res.status(400).json({ success: false, message: "Le site n’existe pas ou est inactif." });
            const terminal = await PointageTerminal.create({ serialNumber, nom, sourceIp, etablissementId, actif: true, lastSeenAt: null });
            return res.status(201).json(terminal);
        } catch (error) {
            if (estErreurUnique(error)) return res.status(409).json({ success: false, message: "Ce numéro de série est déjà enregistré." });
            console.error("[PointageTerminal] erreur de création du terminal:", error);
            return res.status(500).json({ success: false, message: "Le terminal n’a pas pu être enregistré." });
        }
    }

    static async modifierTerminal(req: Request, res: Response): Promise<Response> {
        if (!PointageTerminalController.adminOnly(req, res)) return res;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: "Identifiant de terminal invalide." });

        try {
            const terminal = await PointageTerminal.findOne({ where: { id, protocol: "zkteco_adms" } });
            if (!terminal) {
                return res.status(404).json({ success: false, message: "Terminal non trouvé." });
            }
            const sourceIp = typeof req.body?.sourceIp === "string" ? normalizedIp(req.body.sourceIp.trim()) : undefined;
            const nom = typeof req.body?.nom === "string" ? req.body.nom.trim() : undefined;
            const actif = typeof req.body?.actif === "boolean" ? req.body.actif : undefined;
            if (sourceIp !== undefined && isIP(sourceIp) === 0) return res.status(400).json({ success: false, message: "L’adresse IP autorisée est invalide." });
            if (nom !== undefined && (!nom || nom.length > 120)) return res.status(400).json({ success: false, message: "Le nom du terminal est invalide." });
            if (sourceIp === undefined && nom === undefined && actif === undefined) return res.status(400).json({ success: false, message: "Aucune modification valide." });
            await terminal.update({ ...(sourceIp !== undefined ? { sourceIp } : {}), ...(nom !== undefined ? { nom } : {}), ...(actif !== undefined ? { actif } : {}) });
            return res.status(200).json(terminal);
        } catch (error) {
            console.error("[PointageTerminal] erreur de modification du terminal:", error);
            return res.status(500).json({ success: false, message: "Le terminal n’a pas pu être modifié." });
        }
    }

    static async optionsAdms(req: Request, res: Response): Promise<Response> {
        try {
            const terminal = await PointageTerminalController.terminalAutorise(req);
            if (!terminal) return PointageTerminalController.repondreProtocole(res, "ERROR");
            const options = [
                `GET OPTION FROM: ${terminal.serialNumber}`,
                `Stamp=${terminal.attStamp}`,
                "OpStamp=0",
                "ErrorDelay=30",
                "Delay=10",
                "TransTimes=00:00;23:59",
                "TransInterval=1",
                "TransFlag=TransData AttLog",
                "Realtime=1",
                "Encrypt=0"
            ].join("\n");
            return PointageTerminalController.repondreProtocole(res, options);
        } catch (error) {
            console.error("[PointageTerminal] erreur de négociation ADMS:", error);
            return PointageTerminalController.repondreProtocole(res, "ERROR");
        }
    }

    static async recevoirDonneesAdms(req: Request, res: Response): Promise<Response> {
        try {
            const terminal = await PointageTerminalController.terminalAutorise(req);
            if (!terminal) return PointageTerminalController.repondreProtocole(res, "ERROR");
            const table = typeof req.query.table === "string" ? req.query.table.toUpperCase() : "";
            if (table !== "ATTLOG") return PointageTerminalController.repondreProtocole(res, "OK");
            if (typeof req.body !== "string") return PointageTerminalController.repondreProtocole(res, "ERROR");

            const events = parseAttendanceLogs(req.body);
            if (!events) return PointageTerminalController.repondreProtocole(res, "ERROR");
            events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
            for (const event of events) {
                await PointageTerminalController.processAttendanceEvent(terminal, event);
            }

            const stamp = typeof req.query.Stamp === "string" ? Number(req.query.Stamp) : NaN;
            if (Number.isSafeInteger(stamp) && stamp > terminal.attStamp) {
                await terminal.update({ attStamp: stamp });
            }
            return PointageTerminalController.repondreProtocole(res, "OK");
        } catch (error) {
            console.error("[PointageTerminal] erreur de traitement d’un lot ADMS:", error);
            return PointageTerminalController.repondreProtocole(res, "ERROR");
        }
    }

    static async confirmerCommandeAdms(req: Request, res: Response): Promise<Response> {
        try {
            const terminal = await PointageTerminalController.terminalAutorise(req);
            return PointageTerminalController.repondreProtocole(res, terminal ? "OK" : "ERROR");
        } catch (error) {
            console.error("[PointageTerminal] erreur de commande ADMS:", error);
            return PointageTerminalController.repondreProtocole(res, "ERROR");
        }
    }

    static async processAttendanceEvent(terminal: PointageTerminal, log: AttendanceLog): Promise<boolean> {
        const parsedPin = Number(log.pin);
        const utilisateur = log.utilisateurId
            ? await Utilisateur.findByPk(log.utilisateurId)
            : Number.isSafeInteger(parsedPin) && parsedPin > 0
            ? await Utilisateur.findByPk(parsedPin)
            : null;
        let motifRefus: string | null = null;

        if (!utilisateur || utilisateur.role === RolesUtilisateur.PARENT) {
            motifRefus = "Le PIN ne correspond pas à un compte de pointage autorisé.";
        } else {
            const affectation = await SiteUtilisateur.findOne({
                where: { utilisateurId: utilisateur.id, etablissementId: terminal.etablissementId }
            });
            if (!affectation && Number(utilisateur.etablissementId) !== Number(terminal.etablissementId)) {
                motifRefus = "Le compte n’est pas affecté au site de ce terminal.";
            } else if (utilisateur.role === RolesUtilisateur.APPRENANT) {
                const dossier = await DossierEtudiant.findOne({
                    where: { utilisateurId: utilisateur.id, etablissementId: terminal.etablissementId },
                    include: [{ association: DossierEtudiant.associations.echeances }]
                });
                if (!dossier) {
                    motifRefus = "Aucun dossier d’inscription actif pour cet étudiant.";
                } else {
                    const paiement = VerificationPaiementService.verifierDossier(dossier);
                    if (paiement.statut === "rouge") motifRefus = paiement.message;
                }
            }
        }

        const fingerprint = createHash("sha256")
            .update([terminal.serialNumber, log.pin, log.date, log.time, log.statusCode, log.verifyType].join("|"))
            .digest("hex");
        const sequelize = DatabaseConnection.getInstance().sequelize;

        for (let attempt = 0; attempt < 2; attempt++) {
            const transaction = await sequelize.transaction();
            try {
                let event: PointageTerminalEvent;
                if (log.eventId) {
                    const pendingEvent = await PointageTerminalEvent.findByPk(log.eventId, {
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });
                    if (
                        !pendingEvent ||
                        Number(pendingEvent.terminalId) !== Number(terminal.id) ||
                        pendingEvent.fingerprint !== fingerprint
                    ) {
                        throw new Error("Le reçu Hikvision en attente ne correspond pas à l’événement traité.");
                    }
                    if (pendingEvent.statut !== "en_attente") {
                        await transaction.commit();
                        return false;
                    }
                    event = pendingEvent;
                } else {
                    event = await PointageTerminalEvent.create({
                        terminalId: Number(terminal.id),
                        utilisateurId: utilisateur ? Number(utilisateur.id) : null,
                        etablissementId: Number(terminal.etablissementId),
                        pointageId: null,
                        pin: log.pin,
                        date: log.date,
                        heure: log.time,
                        statusCode: log.statusCode,
                        verifyType: log.verifyType,
                        statut: motifRefus ? "refuse" : "enregistre",
                        motifRefus,
                        fingerprint
                    }, { transaction });
                }

                if (motifRefus || !utilisateur) {
                    await event.update({
                        utilisateurId: utilisateur ? Number(utilisateur.id) : null,
                        statut: "refuse",
                        motifRefus
                    }, { transaction });
                    await transaction.commit();
                    return false;
                }

                let pointage = await Pointage.findOne({
                    where: { utilisateurId: utilisateur.id, date: log.date },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!pointage) {
                    pointage = await Pointage.create({
                        utilisateurId: Number(utilisateur.id),
                        date: log.date,
                        heureArrivee: log.time,
                        heureDepart: null
                    }, { transaction });
                } else if (utilisateur.role === RolesUtilisateur.APPRENANT) {
                    const depart = pointage.heureDepart ? String(pointage.heureDepart).slice(0, 8) : null;
                    if (!depart || log.time > depart) await pointage.update({ heureDepart: log.time }, { transaction });
                } else if (!pointage.heureDepart) {
                    await pointage.update({ heureDepart: log.time }, { transaction });
                }

                if (utilisateur.role === RolesUtilisateur.APPRENANT) {
                    await PointageScan.create({ pointageId: pointage.id, heure: log.time }, { transaction });
                }
                await event.update({
                    utilisateurId: Number(utilisateur.id),
                    pointageId: pointage.id,
                    statut: "enregistre",
                    motifRefus: null
                }, { transaction });
                await transaction.commit();
                return true;
            } catch (error) {
                await transaction.rollback();
                if (estErreurUnique(error)) {
                    const duplicate = await PointageTerminalEvent.findOne({ where: { fingerprint } });
                    if (duplicate) return false;
                    if (attempt === 0) continue;
                }
                throw error;
            }
        }
        throw new Error("Impossible d’enregistrer l’événement du terminal après une collision concurrente.");
    }
}
