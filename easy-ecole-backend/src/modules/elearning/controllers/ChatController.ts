import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import { Salon } from "../models/Salon";
import { Message } from "../models/Message";
import { ParticipantSalon } from "../models/ParticipantSalon";
import { Utilisateur } from "../../auth/models/Utilisateur";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

const CHAT_MEDIA_DIR = path.resolve(process.cwd(), "public", "elearning", "protected", "chat");

function isValidMessageType(type: unknown): type is "text" | "sticker" | "image" | "video" | "fichier" {
    return typeof type === "string" && ["text", "sticker", "image", "video", "fichier"].includes(type);
}

function serializeMessage(message: Message, salonId: string | number): Record<string, unknown> {
    const data = message.toJSON() as Record<string, unknown>;
    if (typeof data.pieceJointe === "string" && data.pieceJointe && !data.pieceJointe.startsWith("data:")) {
        data.mediaExtension = path.extname(data.pieceJointe).toLowerCase();
        data.pieceJointe = `/api/v1/elearning/chat/salons/${salonId}/messages/${data.id}/media`;
    }
    return data;
}

async function isSalonMember(salonId: string | number, utilisateurId: number): Promise<boolean> {
    return !!await ParticipantSalon.findOne({ where: { salonId, utilisateurId } });
}

export default class ChatController {

    static async getMesSalons(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const participations = await ParticipantSalon.findAll({
                where: { utilisateurId },
                include: [{
                    model: Salon,
                    as: 'salon',
                    include: [
                        { model: Message, as: 'messages', attributes: ['id', 'message', 'date', 'typeMessage'], limit: 1, order: [['date', 'DESC']] },
                        { model: ParticipantSalon, as: 'participants' }
                    ]
                }]
            });

            // Récupérer tous les salonIds en une seule fois
            const salonIds = participations.map((p: any) => p.salonId).filter(Boolean);
            const unreadCountMap = new Map<number, number>();
            if (salonIds.length > 0) {
                const unreadRows = await Message.findAll({
                    attributes: [
                        'salonId',
                        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
                    ],
                    where: {
                        salonId: { [Op.in]: salonIds },
                        lu: false,
                        utilisateurId: { [Op.ne]: utilisateurId }
                    },
                    group: ['salonId'],
                    raw: true
                });
                (unreadRows as any[]).forEach((row: any) => {
                    unreadCountMap.set(row.salonId, parseInt(row.count, 10));
                });
            }

            const salons = participations.map((p: any) => {
                const salon = p.salon;
                const nonLues = unreadCountMap.get(salon.id) || 0;
                const dernierMsg = salon.messages?.[0] || null;
                return {
                    ...salon.toJSON(),
                    nonLues,
                    dernierMessage: dernierMsg?.message || (
                        dernierMsg?.typeMessage === "image" ? "📷 Photo"
                        : dernierMsg?.typeMessage === "video" ? "📹 Vidéo"
                        : dernierMsg?.typeMessage === "sticker" ? "🎨 Autocollant"
                        : dernierMsg?.typeMessage === "fichier" ? "📎 Fichier"
                        : salon.dernierMessage
                    ),
                    dateDernierMessage: dernierMsg?.date || salon.dateDernierMessage,
                    role: p.role
                };
            });
            salons.sort((a: any, b: any) => {
                const da = a.dateDernierMessage ? new Date(a.dateDernierMessage).getTime() : 0;
                const db = b.dateDernierMessage ? new Date(b.dateDernierMessage).getTime() : 0;
                return db - da;
            });
            return res.status(200).json(salons);
        } catch (error) {
            console.error('Erreur getMesSalons:', error);
            return res.status(500).json({ success: false, error });
        }
    }

    static async getSalons(req: Request, res: Response): Promise<Response> {
        try {
            const salons = await Salon.findAll({
                where: { estPrive: false },
                attributes: ["id", "titre", "type", "description", "photo", "dateCreation", "codeInvitation"],
                include: [{ model: Utilisateur, as: 'createdBy', attributes: ['id', 'nom', 'prenoms'] }]
            });
            return res.status(200).json(salons);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getSalon(req: Request, res: Response): Promise<Response> {
        try {
            if (!await isSalonMember(req.params.id, Number((req as any).utilisateurId))) {
                return res.status(403).json({ success: false, message: "Accès à ce salon non autorisé." });
            }
            const salon = await Salon.findByPk(req.params.id, {
                include: [
                    { model: ParticipantSalon, as: 'participants' },
                    { model: Utilisateur, as: 'createdBy', attributes: ['id', 'nom', 'prenoms', 'email'] }
                ]
            });
            if (!salon)
                return res.status(404).json({ success: false, message: "Salon non trouvé" });
            return res.status(200).json(salon);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async createSalon(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const titre = String(req.body.titre || "").trim();
            const type = String(req.body.type || "groupe");
            const participants = Array.isArray(req.body.participants) ? req.body.participants.map(Number) : [];
            const participantIds = [...new Set([Number(utilisateurId), ...participants])];
            if (!titre || titre.length > 160) {
                return res.status(400).json({ success: false, message: "Le nom du salon est requis et ne doit pas dépasser 160 caractères." });
            }
            if (!["groupe", "club", "projet", "annonce", "discussion"].includes(type)) {
                return res.status(400).json({ success: false, message: "Type de salon invalide." });
            }
            if (participantIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
                return res.status(400).json({ success: false, message: "La liste des participants est invalide." });
            }
            if (type === "discussion" && participantIds.length !== 2) {
                return res.status(400).json({ success: false, message: "Une discussion privée doit réunir exactement deux personnes." });
            }
            const existingUsers = await Utilisateur.findAll({
                where: { id: { [Op.in]: participantIds } },
                attributes: ["id"],
            });
            if (existingUsers.length !== participantIds.length) {
                return res.status(400).json({ success: false, message: "Un ou plusieurs participants sont introuvables." });
            }
            const code = crypto.randomBytes(4).toString('hex');
            const salon = await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                const createdSalon = await Salon.create({
                    coursId: req.body.coursId || null,
                    titre,
                    type,
                    codeInvitation: code,
                    createdById: utilisateurId,
                    description: String(req.body.description || "").slice(0, 2000),
                    estPrive: type === "discussion" ? true : req.body.estPrive !== false,
                    photo: req.body.photo || null,
                }, { transaction });
                await Promise.all(participantIds.map(participantId => ParticipantSalon.create({
                    salonId: createdSalon.id,
                    utilisateurId: participantId,
                    role: participantId === Number(utilisateurId) ? "admin" : "membre",
                }, { transaction })));
                return createdSalon;
            });
            const created = await Salon.findByPk(salon.id, {
                include: [
                    { model: ParticipantSalon, as: 'participants' },
                    { model: Utilisateur, as: 'createdBy', attributes: ['id', 'nom', 'prenoms'] }
                ]
            });
            return res.status(201).json(created);
        } catch (error) {
            console.error('Erreur createSalon:', error);
            return res.status(400).json({ success: false, error });
        }
    }

    static async getMessages(req: Request, res: Response): Promise<Response> {
        try {
            if (!await isSalonMember(req.params.salonId, Number((req as any).utilisateurId))) {
                return res.status(403).json({ success: false, message: "Accès aux messages non autorisé." });
            }
            const { before, limit } = req.query;
            const where: any = { salonId: req.params.salonId, estSupprime: false };
            if (before && !Number.isNaN(new Date(before as string).getTime())) {
                where.date = { [Op.lt]: new Date(before as string) };
            }
            const msgLimit = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
            const messages = await Message.findAll({
                where,
                order: [['date', 'DESC']],
                limit: msgLimit
            });
            return res.status(200).json(messages.reverse().map(message => serializeMessage(message, req.params.salonId)));
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async sendMessage(req: Request, res: Response): Promise<Response> {
        const utilisateurId = Number((req as any).utilisateurId);
        const salonId = req.params.salonId;
        const uploadedFile = req.file;
        let persisted = false;
        try {
            if (!await isSalonMember(salonId, utilisateurId)) {
                if (uploadedFile) await fs.promises.unlink(uploadedFile.path);
                return res.status(403).json({ success: false, message: "Vous ne participez pas à ce salon." });
            }
            const messageText = String(req.body.message || "").trim();
            let typeMessage = uploadedFile
                ? (uploadedFile.mimetype.startsWith("image/") ? "image" : uploadedFile.mimetype.startsWith("video/") ? "video" : "fichier")
                : String(req.body.typeMessage || "text");
            if (!isValidMessageType(typeMessage) || (!messageText && !uploadedFile && typeMessage !== "sticker")) {
                if (uploadedFile) await fs.promises.unlink(uploadedFile.path);
                return res.status(400).json({ success: false, message: "Un message texte, autocollant ou fichier est requis." });
            }
            if (typeMessage === "sticker" && (!messageText || messageText.length > 32)) {
                return res.status(400).json({ success: false, message: "Autocollant invalide." });
            }
            if (["image", "video", "fichier"].includes(typeMessage) && !uploadedFile) {
                return res.status(400).json({ success: false, message: "Joignez le fichier à envoyer." });
            }
            const persistedMessageText = typeMessage === "fichier" && uploadedFile && !messageText
                ? uploadedFile.originalname
                : messageText;
            const message = await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                const created = await Message.create({
                    salonId,
                    utilisateurId,
                    message: persistedMessageText,
                    typeMessage,
                    pieceJointe: uploadedFile ? path.relative(process.cwd(), uploadedFile.path) : null,
                }, { transaction });
                await Salon.update({
                    dernierMessage: persistedMessageText || (typeMessage === "image" ? "📷 Photo" : typeMessage === "video" ? "📹 Vidéo" : typeMessage === "sticker" ? "🎨 Autocollant" : "📎 Fichier"),
                    dateDernierMessage: new Date()
                }, { where: { id: salonId }, transaction });
                return created;
            });
            persisted = true;
            const responseMessage = serializeMessage(message, salonId);
            const io = req.app.get("io");
            io?.to(`salon:${salonId}`).emit("new:message", responseMessage);
            return res.status(201).json(responseMessage);
        } catch (error) {
            if (uploadedFile && !persisted) await fs.promises.unlink(uploadedFile.path).catch(unlinkError => {
                console.error("[E-learning Chat] Nettoyage du média impossible:", unlinkError);
            });
            return res.status(400).json({ success: false, error });
        }
    }

    static async downloadMedia(req: Request, res: Response): Promise<void> {
        try {
            if (!await isSalonMember(req.params.salonId, Number((req as any).utilisateurId))) {
                res.status(403).json({ success: false, message: "Accès au média non autorisé." });
                return;
            }
            const message = await Message.findOne({
                where: { id: req.params.msgId, salonId: req.params.salonId, estSupprime: false },
            });
            if (!message?.pieceJointe) {
                res.status(404).json({ success: false, message: "Média introuvable." });
                return;
            }
            const filePath = path.resolve(process.cwd(), message.pieceJointe);
            if (!filePath.startsWith(`${CHAT_MEDIA_DIR}${path.sep}`) || !fs.existsSync(filePath)) {
                res.status(404).json({ success: false, message: "Fichier média introuvable." });
                return;
            }
            res.sendFile(filePath);
        } catch (error) {
            console.error("[E-learning Chat] Téléchargement du média impossible:", error);
            res.status(500).json({ success: false, message: "Impossible de servir ce média." });
        }
    }

    static async updateMessage(req: Request, res: Response): Promise<Response> {
        try {
            if (!await isSalonMember(req.params.salonId, Number((req as any).utilisateurId))) {
                return res.status(403).json({ success: false, message: 'Accès à ce salon non autorisé.' });
            }
            const message = await Message.findOne({
                where: { id: req.params.msgId, salonId: req.params.salonId }
            });
            if (!message) return res.status(404).json({ success: false, message: 'Message non trouvé' });
            if (Number(message.utilisateurId) !== Number((req as any).utilisateurId)) {
                return res.status(403).json({ success: false, message: 'Non autorisé' });
            }
            await message.update({ message: req.body.message, estModifie: true });
            return res.status(200).json(message);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async deleteMessage(req: Request, res: Response): Promise<Response> {
        try {
            if (!await isSalonMember(req.params.salonId, Number((req as any).utilisateurId))) {
                return res.status(403).json({ success: false, message: 'Accès à ce salon non autorisé.' });
            }
            const message = await Message.findOne({
                where: { id: req.params.msgId, salonId: req.params.salonId }
            });
            if (!message) return res.status(404).json({ success: false, message: 'Message non trouvé' });
            if (Number(message.utilisateurId) !== Number((req as any).utilisateurId)) {
                return res.status(403).json({ success: false, message: 'Vous ne pouvez supprimer que vos propres messages.' });
            }
            await message.update({ estSupprime: true, message: 'Ce message a été supprimé' });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async ajouterParticipant(req: Request, res: Response): Promise<Response> {
        try {
            const currentUserId = Number((req as any).utilisateurId);
            const requester = await ParticipantSalon.findOne({
                where: { salonId: req.params.salonId, utilisateurId: currentUserId },
            });
            if (!requester || requester.role !== "admin") {
                return res.status(403).json({ success: false, message: "Seul un administrateur du salon peut ajouter un membre." });
            }
            const utilisateurId = Number(req.body.utilisateurId);
            if (!Number.isSafeInteger(utilisateurId) || utilisateurId <= 0 || !await Utilisateur.findByPk(utilisateurId)) {
                return res.status(400).json({ success: false, message: "Utilisateur à ajouter invalide." });
            }
            if (await isSalonMember(req.params.salonId, utilisateurId)) {
                return res.status(409).json({ success: false, message: "Cet utilisateur participe déjà au salon." });
            }
            const participant = await ParticipantSalon.create({
                salonId: req.params.salonId,
                utilisateurId,
                role: 'membre'
            });
            req.app.get("io")?.to(`salon:${req.params.salonId}`).emit("member:added", {
                salonId: req.params.salonId,
                participant,
            });
            return res.status(201).json(participant);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async inviterSalon(req: Request, res: Response): Promise<Response> {
        try {
            const requester = await ParticipantSalon.findOne({
                where: { salonId: req.params.id, utilisateurId: Number((req as any).utilisateurId) },
            });
            if (!requester || requester.role !== "admin") {
                return res.status(403).json({ success: false, message: "Seul un administrateur du salon peut inviter des membres." });
            }
            const salon = await Salon.findByPk(req.params.id);
            if (!salon) return res.status(404).json({ success: false, message: 'Salon non trouvé' });
            if (!salon.codeInvitation) {
                await salon.update({ codeInvitation: crypto.randomBytes(4).toString('hex') });
            }
            const lien = `${req.protocol}://${req.get('host')}/chat/salons/rejoindre/${salon.codeInvitation}`;
            return res.status(200).json({ code: salon.codeInvitation, lien });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async rejoindreSalon(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const salon = await Salon.findOne({ where: { codeInvitation: req.params.code } });
            if (!salon) return res.status(404).json({ success: false, message: 'Lien invalide' });
            if (salon.type === "discussion") return res.status(403).json({ success: false, message: "Une discussion privée ne peut pas être rejointe par invitation." });
            const existant = await ParticipantSalon.findOne({
                where: { salonId: salon.id, utilisateurId }
            });
            if (existant) return res.status(200).json({ success: true, salon, dejaMembre: true });
            await ParticipantSalon.create({ salonId: salon.id, utilisateurId, role: 'membre' });
            return res.status(200).json({ success: true, salon, dejaMembre: false });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async updateParticipantRole(req: Request, res: Response): Promise<Response> {
        try {
            const currentUserId = (req as any).utilisateurId;
            const requester = await ParticipantSalon.findOne({
                where: { salonId: req.params.id, utilisateurId: currentUserId }
            });
            if (!requester || requester.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Seul un admin peut modifier les rôles' });
            }
            const participant = await ParticipantSalon.findOne({
                where: { salonId: req.params.id, utilisateurId: req.params.userId }
            });
            if (!participant) return res.status(404).json({ success: false, message: 'Participant non trouvé' });
            const { role } = req.body;
            if (!role || !['admin', 'membre'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Rôle invalide. Utilisez admin ou membre' });
            }
            await participant.update({ role });
            req.app.get("io")?.to(`salon:${req.params.id}`).emit("member:roleChanged", {
                salonId: req.params.id,
                utilisateurId: Number(req.params.userId),
                role,
            });
            return res.status(200).json({ success: true, role });
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async removeParticipant(req: Request, res: Response): Promise<Response> {
        try {
            const currentUserId = (req as any).utilisateurId;
            const requester = await ParticipantSalon.findOne({
                where: { salonId: req.params.id, utilisateurId: currentUserId }
            });
            const targetUserId = Number(req.params.userId);
            if (!requester || (requester.role !== 'admin' && targetUserId !== Number(currentUserId))) {
                return res.status(403).json({ success: false, message: 'Seul un admin peut retirer un autre participant.' });
            }
            const participant = await ParticipantSalon.findOne({
                where: { salonId: req.params.id, utilisateurId: targetUserId }
            });
            if (!participant) return res.status(404).json({ success: false, message: 'Participant non trouvé' });
            await participant.destroy();
            req.app.get("io")?.to(`salon:${req.params.id}`).emit("member:removed", {
                salonId: req.params.id,
                utilisateurId: targetUserId,
            });
            req.app.get("io")?.in(`user:${targetUserId}`).socketsLeave(`salon:${req.params.id}`);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async marquerLu(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const { messageIds } = req.body;
            if (!await isSalonMember(req.params.id, Number(utilisateurId))) {
                return res.status(403).json({ success: false, message: "Accès à ce salon non autorisé." });
            }
            if (messageIds && Array.isArray(messageIds)) {
                await Message.update({ lu: true }, {
                    where: { id: { [Op.in]: messageIds }, salonId: req.params.id, utilisateurId: { [Op.ne]: utilisateurId } }
                });
            } else {
                await Message.update({ lu: true }, {
                    where: { salonId: req.params.id, utilisateurId: { [Op.ne]: utilisateurId }, lu: false }
                });
            }
            await ParticipantSalon.update({ dateDerniereLecture: new Date() }, {
                where: { salonId: req.params.id, utilisateurId }
            });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async getNonLues(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            if (!await isSalonMember(req.params.id, Number(utilisateurId))) {
                return res.status(403).json({ success: false, message: "Accès à ce salon non autorisé." });
            }
            const count = await Message.count({
                where: { salonId: req.params.id, lu: false, utilisateurId: { [Op.ne]: utilisateurId } }
            });
            return res.status(200).json({ count });
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getParticipants(req: Request, res: Response): Promise<Response> {
        try {
            if (!await isSalonMember(req.params.id, Number((req as any).utilisateurId))) {
                return res.status(403).json({ success: false, message: "Accès à ce salon non autorisé." });
            }
            const participants = await ParticipantSalon.findAll({
                where: { salonId: req.params.id },
                include: [{
                    model: Salon,
                    as: 'salon',
                    attributes: ['titre']
                }]
            });
            return res.status(200).json(participants);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }
}
