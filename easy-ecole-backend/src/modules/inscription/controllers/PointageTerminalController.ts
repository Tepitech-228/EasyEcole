import { createHash } from "crypto";
import { isIP } from "net";
import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { JoursSemaine } from "../../../core/enums/JoursSemaine";
import { Enseignant } from "../../auth/models/Enseignant";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Pointage } from "../models/Pointage";
import { PointageScan } from "../models/PointageScan";
import { PointageTerminal } from "../models/PointageTerminal";
import { PointageTerminalEvent } from "../models/PointageTerminalEvent";
import { Seance } from "../models/Seance";
import { SeancePointage } from "../models/SeancePointage";
import PointageTerminalTokenService from "../services/PointageTerminalTokenService";
import SeancePointageConfirmationService from "../services/SeancePointageConfirmationService";
import { VerificationPaiementService } from "../services/VerificationPaiementService";
import SituationFinanciereService, { SituationFinanciere } from "../services/SituationFinanciereService";

interface AttendanceLog {
    pin: string;
    date: string;
    time: string;
    statusCode: number;
    verifyType: number;
    utilisateurId?: number;
    eventId?: number;
}

export interface AttendanceProcessingResult {
    recorded: boolean;
    mode: "arrivee" | "depart" | "passage" | "refuse";
    role: string | null;
    motifRefus: string | null;
    avertissementPaiement: string | null;
    situationFinanciere: SituationFinanciere | null;
    enseignantNonProgramme?: boolean;
    heureArrivee?: string | null;
    heureDepart?: string | null;
    seancePointage?: {
        action: "debut" | "fin";
        seanceId: number;
        cours: string;
        heureDebutPrevue: string;
        heureFinPrevue: string;
        heureDebutReelle: string;
        heureFinReelle: string | null;
        heureReelle: string;
        confirmationToken?: string;
    };
}

interface TeacherSessionPointage {
    action: "debut" | "fin";
    seanceId: number;
    cours: string;
    heureDebutPrevue: string;
    heureFinPrevue: string;
    heureDebutReelle: string;
    heureFinReelle: string | null;
    heureReelle: string;
    confirmationToken?: string;
}

function heurePointage(value: unknown): string {
    const text = value instanceof Date ? value.toISOString() : String(value ?? "");
    const match = text.match(/(?:^|T)(\d{2}):(\d{2})(?::(\d{2}))?/);
    return match ? `${match[1]}:${match[2]}:${match[3] || "00"}` : "";
}

function minutesHeure(value: unknown): number {
    const time = heurePointage(value);
    return time ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)) : -1;
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
        if (!terminal || !PointageTerminalTokenService.authorize(terminal, req)) return null;
        await terminal.update({ lastSeenAt: new Date() });
        return terminal;
    }

    private static repondreProtocole(res: Response, body: string): Response {
        return res.status(200).type("text/plain").send(body);
    }

    private static toClientTerminal(terminal: PointageTerminal, deviceToken?: string): Record<string, unknown> {
        return {
            id: terminal.id,
            serialNumber: terminal.serialNumber,
            nom: terminal.nom,
            sourceIp: terminal.sourceIp,
            etablissementId: terminal.etablissementId,
            protocol: terminal.protocol,
            actif: terminal.actif,
            lastSeenAt: terminal.lastSeenAt,
            hasDeviceToken: Boolean(terminal.deviceTokenHash),
            ...(deviceToken ? { deviceToken } : {})
        };
    }

    static async getTerminaux(req: Request, res: Response): Promise<Response> {
        if (!PointageTerminalController.adminOnly(req, res)) return res;
        try {
            const terminaux = await PointageTerminal.findAll({
                where: { protocol: "zkteco_adms" },
                order: [["nom", "ASC"]]
            });
            return res.status(200).json(terminaux.map(terminal => PointageTerminalController.toClientTerminal(terminal)));
        } catch (error) {
            console.error("[PointageTerminal] erreur de chargement des terminaux:", error);
            return res.status(500).json({ success: false, message: "Les terminaux n’ont pas pu être chargés." });
        }
    }

    static async creerTerminal(req: Request, res: Response): Promise<Response> {
        if (!PointageTerminalController.adminOnly(req, res)) return res;
        const serialNumber = typeof req.body?.serialNumber === "string" ? req.body.serialNumber.trim() : "";
        const nom = typeof req.body?.nom === "string" ? req.body.nom.trim() : "";
        const sourceIpValue = typeof req.body?.sourceIp === "string" ? normalizedIp(req.body.sourceIp.trim()) : "";
        const sourceIp = sourceIpValue || null;
        const etablissementId = Number(req.body?.etablissementId);
        if (!/^[A-Za-z0-9._-]{2,64}$/.test(serialNumber) || !nom || nom.length > 120
            || (sourceIp !== null && isIP(sourceIp) === 0)
            || !Number.isSafeInteger(etablissementId) || etablissementId <= 0) {
            return res.status(400).json({ success: false, message: "Numéro de série, nom, IP autorisée ou site invalide." });
        }
        try {
            const site = await Etablissement.findOne({ where: { id: etablissementId, actif: true } });
            if (!site) return res.status(400).json({ success: false, message: "Le site n’existe pas ou est inactif." });
            const generated = PointageTerminalTokenService.generate();
            const terminal = await PointageTerminal.create({
                serialNumber,
                nom,
                sourceIp,
                deviceTokenHash: generated.hash,
                etablissementId,
                actif: true,
                lastSeenAt: null
            });
            return res.status(201).json(PointageTerminalController.toClientTerminal(terminal, generated.token));
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
            const sourceIpValue = typeof req.body?.sourceIp === "string" ? normalizedIp(req.body.sourceIp.trim()) : undefined;
            const sourceIp = sourceIpValue === undefined ? undefined : (sourceIpValue || null);
            const nom = typeof req.body?.nom === "string" ? req.body.nom.trim() : undefined;
            const actif = typeof req.body?.actif === "boolean" ? req.body.actif : undefined;
            if (sourceIp !== undefined && sourceIp !== null && isIP(sourceIp) === 0) return res.status(400).json({ success: false, message: "L’adresse IP autorisée est invalide." });
            if (nom !== undefined && (!nom || nom.length > 120)) return res.status(400).json({ success: false, message: "Le nom du terminal est invalide." });
            if (sourceIp === undefined && nom === undefined && actif === undefined) return res.status(400).json({ success: false, message: "Aucune modification valide." });
            await terminal.update({ ...(sourceIp !== undefined ? { sourceIp } : {}), ...(nom !== undefined ? { nom } : {}), ...(actif !== undefined ? { actif } : {}) });
            return res.status(200).json(PointageTerminalController.toClientTerminal(terminal));
        } catch (error) {
            console.error("[PointageTerminal] erreur de modification du terminal:", error);
            return res.status(500).json({ success: false, message: "Le terminal n’a pas pu être modifié." });
        }
    }

    /**
     * Génère un nouveau jeton et invalide immédiatement l'ancien.
     * Le secret en clair n'est renvoyé qu'une seule fois, à cet appel.
     */
    static async regenererToken(req: Request, res: Response): Promise<Response> {
        if (!PointageTerminalController.adminOnly(req, res)) return res;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: "Identifiant de terminal invalide." });
        }
        try {
            const terminal = await PointageTerminal.findOne({ where: { id, protocol: "zkteco_adms" } });
            if (!terminal) return res.status(404).json({ success: false, message: "Terminal non trouvé." });
            const generated = PointageTerminalTokenService.generate();
            await terminal.update({ deviceTokenHash: generated.hash });
            return res.status(200).json({ success: true, deviceToken: generated.token });
        } catch (error) {
            console.error("[PointageTerminal] erreur de rotation du jeton:", error);
            return res.status(500).json({ success: false, message: "Le jeton du terminal n’a pas pu être renouvelé." });
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

    private static async enregistrerPointageSeanceEnseignant(
        utilisateur: Utilisateur,
        terminal: PointageTerminal,
        log: AttendanceLog,
        transaction: Transaction
    ): Promise<{ pointage: TeacherSessionPointage | null; motifRefus: string | null; nonProgramme?: boolean }> {
        const enseignant = await Enseignant.findOne({
            where: { utilisateurId: utilisateur.id },
            attributes: ["id"],
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!enseignant) {
            return { pointage: null, motifRefus: "Aucun planning de cours n’est associé à ce compte enseignant." };
        }

        const siteId = Number(terminal.etablissementId);
        const sessionsActives = await SeancePointage.findAll({
            where: {
                utilisateurId: Number(utilisateur.id),
                enseignantId: Number(enseignant.id),
                etablissementId: siteId,
                date: log.date,
                heureDebutReelle: { [Op.ne]: null },
                heureFinReelle: null
            },
            order: [["heureDebutReelle", "ASC"]],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        const construirePointage = (
            action: "debut" | "fin",
            seance: Seance,
            heureDebutReelle: string,
            heureFinReelle: string | null,
            heureReelle: string,
            confirmationToken?: string
        ): TeacherSessionPointage => ({
            action,
            seanceId: Number(seance.id),
            cours: String(seance.cours?.intitule || seance.titre || "Cours planifié"),
            heureDebutPrevue: heurePointage(seance.heureDebut),
            heureFinPrevue: heurePointage(seance.heureFin),
            heureDebutReelle,
            heureFinReelle,
            heureReelle,
            confirmationToken
        });

        if (sessionsActives.length > 1) {
            return {
                pointage: null,
                motifRefus: "Plusieurs cours sont déjà en cours. Aucun pointage n’a été enregistré."
            };
        }

        const heureReelle = heurePointage(log.time);
        if (!heureReelle) {
            return { pointage: null, motifRefus: "L’heure transmise par le terminal est invalide." };
        }

        if (sessionsActives.length === 1) {
            const pointageActif = sessionsActives[0];
            const seance = await Seance.findOne({
                where: {
                    id: pointageActif.seanceId,
                    enseignantId: Number(enseignant.id),
                    etablissementId: siteId
                },
                include: [{ association: Seance.associations.cours, required: true }],
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!seance) {
                return { pointage: null, motifRefus: "Le cours en cours n’a pas pu être retrouvé. Aucun pointage n’a été enregistré." };
            }

            const heureDebutReelle = heurePointage(pointageActif.heureDebutReelle);
            const confirmationToken = SeancePointageConfirmationService.creer({
                seancePointageId: Number(pointageActif.id),
                utilisateurId: Number(utilisateur.id),
                etablissementId: siteId,
                date: log.date,
                heureFin: heureReelle
            });
            return {
                pointage: construirePointage("fin", seance, heureDebutReelle, null, heureReelle, confirmationToken),
                motifRefus: null
            };
        }

        const dateValue = new Date(`${log.date}T00:00:00.000Z`);
        const jour = dateValue.getUTCDay() || 7;
        const heureEnMinutes = minutesHeure(heureReelle);
        const seances = await Seance.findAll({
            where: {
                enseignantId: Number(enseignant.id),
                etablissementId: siteId,
                jourSemaine: String(jour) as JoursSemaine,
                dateDebut: { [Op.lte]: log.date },
                dateFin: { [Op.gte]: log.date },
                publieeLe: { [Op.ne]: null }
            },
            include: [{ association: Seance.associations.cours, required: true }],
            order: [["heureDebut", "ASC"]],
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        const seancesEnCours = seances.filter(seance => {
            const debut = minutesHeure(seance.heureDebut);
            const fin = minutesHeure(seance.heureFin);
            return debut >= 0 && fin > debut && heureEnMinutes >= debut && heureEnMinutes < fin;
        });
        if (seancesEnCours.length === 0) {
            return {
                pointage: null,
                motifRefus: "Vous n’êtes pas programmé à cette heure. Aucun pointage n’a été enregistré.",
                nonProgramme: true
            };
        }
        if (seancesEnCours.length > 1) {
            return {
                pointage: null,
                motifRefus: "Plusieurs cours sont programmés à cette heure. Aucun pointage n’a été enregistré."
            };
        }

        const seance = seancesEnCours[0];
        const pointageExistant = await SeancePointage.findOne({
            where: { seanceId: Number(seance.id), date: log.date },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (pointageExistant?.heureDebutReelle || pointageExistant?.heureFinReelle) {
            return {
                pointage: null,
                motifRefus: "Ce cours a déjà été pointé aujourd’hui. Aucun nouveau pointage n’a été enregistré."
            };
        }

        if (pointageExistant) {
            await pointageExistant.update({ heureDebutReelle: heureReelle }, { transaction });
        } else {
            await SeancePointage.create({
                seanceId: Number(seance.id),
                date: log.date,
                enseignantId: String(enseignant.id),
                utilisateurId: Number(utilisateur.id),
                etablissementId: siteId,
                heureDebutReelle: heureReelle,
                heureFinReelle: null
            }, { transaction });
        }
        return {
            pointage: construirePointage("debut", seance, heureReelle, null, heureReelle),
            motifRefus: null
        };
    }

    static async processAttendanceEvent(terminal: PointageTerminal, log: AttendanceLog): Promise<AttendanceProcessingResult> {
        const parsedPin = Number(log.pin);
        const utilisateur = log.utilisateurId
            ? await Utilisateur.findByPk(log.utilisateurId)
            : Number.isSafeInteger(parsedPin) && parsedPin > 0
            ? await Utilisateur.findByPk(parsedPin)
            : null;
        let motifRefus: string | null = null;
        let avertissementPaiement: string | null = null;
        let situationFinanciere: SituationFinanciere | null = null;

        if (log.verifyType === 6 || log.verifyType === 76) {
            // Sur ce terminal, 75 = authentification faciale réussie (la porte
            // s'ouvre), tandis que 6/76 = visage reconnu mais accès refusé
            // (droits insuffisants ou échec de vérification). Ces événements ne
            // doivent jamais créer ni modifier un pointage.
            motifRefus = "Le terminal a refusé l'accès (authentification ou droits insuffisants).";
        } else if (!utilisateur || utilisateur.role === RolesUtilisateur.PARENT) {
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
                    situationFinanciere = SituationFinanciereService.calculer(dossier);
                    const paiement = VerificationPaiementService.verifierDossier(dossier);
                    if (paiement.statut === "rouge") motifRefus = paiement.message;
                    else avertissementPaiement = paiement.avertissementPaiement || null;
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
                        return { recorded: false, mode: "passage", role: utilisateur?.role ?? null, motifRefus: null, avertissementPaiement: null, situationFinanciere: null };
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

                let pointageSeance: TeacherSessionPointage | null = null;
                let enseignantNonProgramme = false;
                if (!motifRefus && utilisateur?.role === RolesUtilisateur.ENSEIGNANT) {
                    const resultatSeance = await PointageTerminalController.enregistrerPointageSeanceEnseignant(
                        utilisateur,
                        terminal,
                        log,
                        transaction
                    );
                    motifRefus = resultatSeance.motifRefus;
                    pointageSeance = resultatSeance.pointage;
                    enseignantNonProgramme = resultatSeance.nonProgramme === true;
                }

                if (motifRefus || !utilisateur) {
                    await event.update({
                        utilisateurId: utilisateur ? Number(utilisateur.id) : null,
                        statut: "refuse",
                        motifRefus
                    }, { transaction });
                    await transaction.commit();
                    return {
                        recorded: false,
                        mode: "refuse",
                        role: utilisateur?.role ?? null,
                        motifRefus,
                        avertissementPaiement: null,
                        situationFinanciere,
                        enseignantNonProgramme
                    };
                }

                const estApprenant = utilisateur.role === RolesUtilisateur.APPRENANT;
                let mode: "arrivee" | "depart" | "passage";
                let pointage = await Pointage.findOne({
                    where: { utilisateurId: utilisateur.id, date: log.date },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (pointageSeance) {
                    mode = pointageSeance.action === "debut" ? "arrivee" : "passage";
                    if (!pointage) {
                        pointage = await Pointage.create({
                            utilisateurId: Number(utilisateur.id),
                            date: log.date,
                            heureArrivee: pointageSeance.heureDebutReelle,
                            heureDepart: null
                        }, { transaction });
                    } else if (pointageSeance.action === "debut" && pointage.heureDepart) {
                        await pointage.update({ heureDepart: null }, { transaction });
                    }
                } else if (!pointage) {
                    // Première détection de la journée : ligne conteneur (arrivée).
                    pointage = await Pointage.create({
                        utilisateurId: Number(utilisateur.id),
                        date: log.date,
                        heureArrivee: log.time,
                        heureDepart: null
                    }, { transaction });
                    mode = estApprenant ? "passage" : "arrivee";
                } else if (estApprenant) {
                    // Étudiant : chaque détection est un passage, jamais un départ.
                    mode = "passage";
                } else {
                    // Une détection biométrique ne suffit pas à valider un départ.
                    // Le surveillant doit le confirmer depuis l'écran de pointage.
                    mode = "passage";
                }

                if (estApprenant) {
                    await PointageScan.create({ pointageId: pointage.id, heure: log.time }, { transaction });
                }
                await event.update({
                    utilisateurId: Number(utilisateur.id),
                    pointageId: pointage.id,
                    statut: "enregistre",
                    motifRefus: null
                }, { transaction });
                await transaction.commit();
                return {
                    recorded: true,
                    mode,
                    role: utilisateur.role,
                    motifRefus: null,
                    avertissementPaiement,
                    situationFinanciere,
                    heureArrivee: heurePointage(pointage.heureArrivee) || null,
                    heureDepart: heurePointage(pointage.heureDepart) || null,
                    seancePointage: pointageSeance || undefined
                };
            } catch (error) {
                await transaction.rollback();
                if (estErreurUnique(error)) {
                    const duplicate = await PointageTerminalEvent.findOne({ where: { fingerprint } });
                    if (duplicate) return { recorded: false, mode: "passage", role: utilisateur?.role ?? null, motifRefus: null, avertissementPaiement: null, situationFinanciere: null };
                    if (attempt === 0) continue;
                }
                throw error;
            }
        }
        throw new Error("Impossible d’enregistrer l’événement du terminal après une collision concurrente.");
    }
}
