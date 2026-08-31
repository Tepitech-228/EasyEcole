import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from 'jsonwebtoken';
import { Message } from "../models/Message";
import { ParticipantSalon } from "../models/ParticipantSalon";
import { JWT_SECRET } from "../../../core/config/jwt";

const presenceOnline = new Set<number>();

export const setupChatSocket = (io: SocketIOServer): void => {

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token
        if (!token) {
            return next(new Error('Authentication required'))
        }
        try {
            const decoded = jwt.verify(token as string, JWT_SECRET) as any
            ;(socket as any).utilisateurId = decoded.id
            ;(socket as any).utilisateurRole = decoded.role
            next()
        } catch {
            next(new Error('Invalid token'))
        }
    })

    io.on('connection', (socket: Socket) => {
        console.log(`Utilisateur connecté au chat: ${socket.id}`);

        socket.on('join:salon', (salonId: string) => {
            socket.join(`salon:${salonId}`);
            console.log(`Socket ${socket.id} a rejoint le salon ${salonId}`);
        });

        socket.on('leave:salon', (salonId: string) => {
            socket.leave(`salon:${salonId}`);
        });

        socket.on('send:message', async (data: { 
            salonId: string, 
            message: string, 
            utilisateurId: number,
            typeMessage?: string,
            pieceJointe?: string | null
        }) => {
            try {
                const message = await Message.create({
                    salonId: data.salonId,
                    utilisateurId: data.utilisateurId,
                    message: data.message,
                    typeMessage: data.typeMessage || 'text',
                    pieceJointe: data.pieceJointe || null
                });

                const { Salon } = require('../models/Salon');
                await Salon.update({
                    dernierMessage: data.typeMessage === 'image' ? 'Photo' 
                        : data.typeMessage === 'video' ? 'Video'
                        : data.typeMessage === 'sticker' ? 'Sticker'
                        : data.typeMessage === 'fichier' ? 'Fichier'
                        : data.message,
                    dateDernierMessage: new Date()
                }, { where: { id: data.salonId } });

                io.to(`salon:${data.salonId}`).emit('new:message', message);
            } catch (error) {
                console.error('Erreur envoi message socket:', error);
            }
        });

        socket.on('typing', (data: { salonId: string, utilisateurId: number }) => {
            socket.to(`salon:${data.salonId}`).emit('typing', {
                utilisateurId: data.utilisateurId,
                salonId: data.salonId
            });
        });

        socket.on('message:seen', async (data: { salonId: string, messageIds: number[], utilisateurId: number }) => {
            try {
                if (data.messageIds && data.messageIds.length > 0) {
                    await Message.update({ lu: true }, {
                        where: { id: data.messageIds, salonId: data.salonId }
                    });
                }
                await ParticipantSalon.update({ dateDerniereLecture: new Date() }, {
                    where: { salonId: data.salonId, utilisateurId: data.utilisateurId }
                });
                io.to(`salon:${data.salonId}`).emit('messages:seen', {
                    messageIds: data.messageIds,
                    utilisateurId: data.utilisateurId,
                    salonId: data.salonId
                });
            } catch (error) {
                console.error('Erreur message:seen:', error);
            }
        });

        socket.on('message:delete', async (data: { salonId: string, messageId: number }) => {
            try {
                await Message.update({ estSupprime: true, message: 'Ce message a été supprimé' }, {
                    where: { id: data.messageId }
                });
                io.to(`salon:${data.salonId}`).emit('message:deleted', {
                    messageId: data.messageId,
                    salonId: data.salonId
                });
            } catch (error) {
                console.error('Erreur message:delete:', error);
            }
        });

        socket.on('message:edit', async (data: { salonId: string, messageId: number, newMessage: string }) => {
            try {
                await Message.update({ message: data.newMessage, estModifie: true }, {
                    where: { id: data.messageId }
                });
                io.to(`salon:${data.salonId}`).emit('message:edited', {
                    messageId: data.messageId,
                    newMessage: data.newMessage,
                    salonId: data.salonId
                });
            } catch (error) {
                console.error('Erreur message:edit:', error);
            }
        });

        socket.on('user:online', (data: { utilisateurId: number }) => {
            presenceOnline.add(data.utilisateurId);
            io.emit('presence', { utilisateurId: data.utilisateurId, online: true });
        });

        socket.on('user:offline', (data: { utilisateurId: number }) => {
            presenceOnline.delete(data.utilisateurId);
            io.emit('presence', { utilisateurId: data.utilisateurId, online: false });
        });

        socket.on('disconnect', () => {
            const utilisateurId = (socket as any).utilisateurId;
            if (utilisateurId != null) {
                presenceOnline.delete(utilisateurId);
                io.emit('presence', { utilisateurId, online: false });
            }
            console.log(`Utilisateur déconnecté du chat: ${socket.id}`);
        });

        socket.on('member:add', async (data: { salonId: string, utilisateurId: number, addedBy: number }) => {
            try {
                const { Salon } = require('../models/Salon');
                const { ParticipantSalon } = require('../models/ParticipantSalon');
                const participant = await ParticipantSalon.create({
                    salonId: data.salonId,
                    utilisateurId: data.utilisateurId,
                    role: 'membre'
                });
                const salon = await Salon.findByPk(data.salonId, {
                    include: [{ model: require('../models/ParticipantSalon'), as: 'participants' }]
                });
                io.to(`salon:${data.salonId}`).emit('member:added', {
                    salonId: data.salonId,
                    participant,
                    memberCount: salon?.participants?.length || 0
                });
            } catch (error) {
                console.error('Erreur member:add:', error);
            }
        });

        socket.on('member:remove', async (data: { salonId: string, utilisateurId: number }) => {
            try {
                const { ParticipantSalon } = require('../models/ParticipantSalon');
                await ParticipantSalon.destroy({
                    where: { salonId: data.salonId, utilisateurId: data.utilisateurId }
                });
                io.to(`salon:${data.salonId}`).emit('member:removed', {
                    salonId: data.salonId,
                    utilisateurId: data.utilisateurId
                });
            } catch (error) {
                console.error('Erreur member:remove:', error);
            }
        });

        socket.on('member:role', async (data: { salonId: string, utilisateurId: number, role: string }) => {
            try {
                const { ParticipantSalon } = require('../models/ParticipantSalon');
                await ParticipantSalon.update({ role: data.role }, {
                    where: { salonId: data.salonId, utilisateurId: data.utilisateurId }
                });
                io.to(`salon:${data.salonId}`).emit('member:roleChanged', {
                    salonId: data.salonId,
                    utilisateurId: data.utilisateurId,
                    role: data.role
                });
            } catch (error) {
                console.error('Erreur member:role:', error);
            }
        });
    });
};