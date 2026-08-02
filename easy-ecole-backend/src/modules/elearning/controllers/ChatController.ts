import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import { Salon } from "../models/Salon";
import { Message } from "../models/Message";
import { ParticipantSalon } from "../models/ParticipantSalon";
import { Utilisateur } from "../../auth/models/Utilisateur";
import crypto from "crypto";

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
                        { model: Message, as: 'messages', limit: 1, order: [['date', 'DESC']] },
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
                    dernierMessage: dernierMsg?.message || null,
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
                include: [
                    { model: Message, as: 'messages', order: [['date', 'DESC']], limit: 1 },
                    { model: ParticipantSalon, as: 'participants' },
                    { model: Utilisateur, as: 'createdBy', attributes: ['id', 'nom', 'prenoms', 'email'] }
                ]
            });
            return res.status(200).json(salons);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async getSalon(req: Request, res: Response): Promise<Response> {
        try {
            const salon = await Salon.findByPk(req.params.id, {
                include: [
                    { model: Message, as: 'messages', order: [['date', 'ASC']] },
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
            const code = crypto.randomBytes(4).toString('hex');
            const salon = await Salon.create({
                coursId: req.body.coursId || null,
                titre: req.body.titre,
                type: req.body.type || 'groupe',
                codeInvitation: code,
                createdById: utilisateurId,
                description: req.body.description || '',
                estPrive: req.body.estPrive !== undefined ? req.body.estPrive : true,
                photo: req.body.photo || null
            });
            await ParticipantSalon.create({
                salonId: salon.id,
                utilisateurId,
                role: 'admin'
            });
            const participants = req.body.participants || [];
            for (const pid of participants) {
                const participantId = Number(pid);
                if (!participantId) {
                    return res.status(400).json({ success: false, message: `Participant invalide : ${pid}` });
                }
                if (participantId === Number(utilisateurId)) continue;
                await ParticipantSalon.create({
                    salonId: salon.id,
                    utilisateurId: participantId,
                    role: 'membre'
                });
            }
            const created = await Salon.findByPk(salon.id, {
                include: [
                    { model: Message, as: 'messages' },
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
            const { before, limit } = req.query;
            const where: any = { salonId: req.params.salonId, estSupprime: false };
            if (before) {
                where.date = { [Op.lt]: new Date(before as string) };
            }
            const msgLimit = Math.min(parseInt(limit as string) || 50, 100);
            const messages = await Message.findAll({
                where,
                order: [['date', 'DESC']],
                limit: msgLimit
            });
            return res.status(200).json(messages.reverse());
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async sendMessage(req: Request, res: Response): Promise<Response> {
        try {
            const message = await Message.create({
                salonId: req.params.salonId,
                utilisateurId: (req as any).utilisateurId,
                message: req.body.message || '',
                typeMessage: req.body.typeMessage || 'text',
                pieceJointe: req.body.pieceJointe || null
            });
            await Salon.update({
                dernierMessage: req.body.message || (req.body.typeMessage === 'image' ? '📷 Photo' : req.body.typeMessage === 'video' ? '📹 Vidéo' : req.body.typeMessage === 'sticker' ? '🎨 Sticker' : req.body.typeMessage === 'fichier' ? '📎 Fichier' : ''),
                dateDernierMessage: new Date()
            }, { where: { id: req.params.salonId } });
            return res.status(201).json(message);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async updateMessage(req: Request, res: Response): Promise<Response> {
        try {
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
            const message = await Message.findOne({
                where: { id: req.params.msgId, salonId: req.params.salonId }
            });
            if (!message) return res.status(404).json({ success: false, message: 'Message non trouvé' });
            await message.update({ estSupprime: true, message: 'Ce message a été supprimé' });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async ajouterParticipant(req: Request, res: Response): Promise<Response> {
        try {
            const participant = await ParticipantSalon.create({
                salonId: req.params.salonId,
                utilisateurId: req.body.utilisateurId,
                role: req.body.role || 'membre'
            });
            return res.status(201).json(participant);
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async inviterSalon(req: Request, res: Response): Promise<Response> {
        try {
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
            if (!requester || requester.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Seul un admin peut retirer des participants' });
            }
            const participant = await ParticipantSalon.findOne({
                where: { salonId: req.params.id, utilisateurId: req.params.userId }
            });
            if (!participant) return res.status(404).json({ success: false, message: 'Participant non trouvé' });
            await participant.destroy();
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(400).json({ success: false, error });
        }
    }

    static async marquerLu(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateurId = (req as any).utilisateurId;
            const { messageIds } = req.body;
            if (messageIds && Array.isArray(messageIds)) {
                await Message.update({ lu: true }, {
                    where: { id: { [Op.in]: messageIds }, salonId: req.params.id }
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
