import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from 'jsonwebtoken';
import { Message } from "../models/Message";
import { ParticipantSalon } from "../models/ParticipantSalon";
import { Salon } from "../models/Salon";
import { JWT_SECRET } from "../../../core/config/jwt";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { SiteUtilisateur } from "../../auth/models/SiteUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Op } from "sequelize";

const presenceOnline = new Set<number>();
const POINTAGE_VIEWER_ROLES = new Set<RolesUtilisateur>([
    RolesUtilisateur.INSTITUTION,
    RolesUtilisateur.CAISSIER_BANQUE,
    RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
    RolesUtilisateur.RESSOURCES_HUMAINES,
    RolesUtilisateur.CABINET_COMPTABLE,
    RolesUtilisateur.ESA_COMPTA,
    RolesUtilisateur.COMITE_ORIENTATION,
    RolesUtilisateur.SECRETAIRE,
    RolesUtilisateur.SURVEILLANT,
    RolesUtilisateur.SUPERVISEUR_GENERAL
]);

async function rejoindreRoomsPointage(socket: Socket): Promise<void> {
    const utilisateurId = Number((socket as any).utilisateurId);
    const role = (socket as any).utilisateurRole as RolesUtilisateur;
    if (role === RolesUtilisateur.ADMIN) {
        await socket.join("pointage:administrateurs");
        return;
    }
    if (!POINTAGE_VIEWER_ROLES.has(role) || !Number.isSafeInteger(utilisateurId) || utilisateurId <= 0) return;

    const [utilisateur, affectations] = await Promise.all([
        Utilisateur.findByPk(utilisateurId, { attributes: ["etablissementId"] }),
        SiteUtilisateur.findAll({ where: { utilisateurId }, attributes: ["etablissementId"] })
    ]);
    const siteIds = new Set<number>([
        ...(utilisateur?.etablissementId ? [Number(utilisateur.etablissementId)] : []),
        ...affectations.map(affectation => Number(affectation.etablissementId))
    ]);
    for (const etablissementId of siteIds) {
        if (Number.isSafeInteger(etablissementId) && etablissementId > 0) {
            await socket.join(`pointage:site:${etablissementId}`);
        }
    }
}

function currentUserId(socket: Socket): number {
    return Number((socket as any).utilisateurId);
}

async function isSalonMember(salonId: string | number, utilisateurId: number): Promise<boolean> {
    return !!await ParticipantSalon.findOne({ where: { salonId, utilisateurId } });
}

async function isSalonAdmin(salonId: string | number, utilisateurId: number): Promise<boolean> {
    const membership = await ParticipantSalon.findOne({ where: { salonId, utilisateurId } });
    return membership?.role === "admin";
}

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
        void socket.join(`user:${currentUserId(socket)}`);
        void rejoindreRoomsPointage(socket).catch(error => {
            console.error("[Pointage] Impossible d’autoriser les salons temps réel:", error);
        });

        socket.on('join:salon', async (salonId: string) => {
            if (!await isSalonMember(salonId, currentUserId(socket))) return;
            await socket.join(`salon:${salonId}`);
        });

        socket.on('call:join', async (data: { salonId: string | number }) => {
            const roomId = String(data.salonId);
            if (!await isSalonMember(roomId, currentUserId(socket))) return;
            socket.join(`call:${roomId}`);
            io.to(`call:${roomId}`).emit('call:state', {
                roomId,
                utilisateurId: currentUserId(socket),
                type: 'join'
            });
        });

        socket.on('call:leave', async (data: { salonId: string | number }) => {
            const roomId = String(data.salonId);
            if (!await isSalonMember(roomId, currentUserId(socket))) return;
            socket.leave(`call:${roomId}`);
            io.to(`call:${roomId}`).emit('call:state', {
                roomId,
                utilisateurId: currentUserId(socket),
                type: 'leave'
            });
        });

        socket.on('call:signal', async (data: any) => {
            if (!data?.roomId || !socket.rooms.has(`call:${String(data.roomId)}`)) return;
            const roomId = String(data.roomId);
            if (!await isSalonMember(roomId, currentUserId(socket))) return;
            if (data.toUserId && !await isSalonMember(roomId, Number(data.toUserId))) return;
            const payload = {
                ...data,
                fromUserId: currentUserId(socket),
                roomId
            };
            socket.to(`call:${roomId}`).emit('call:signal', payload);
        });

        socket.on('leave:salon', (salonId: string) => {
            socket.leave(`salon:${salonId}`);
        });

        socket.on('send:message', async (data: { 
            salonId: string, 
            message: string, 
            utilisateurId?: number,
            typeMessage?: string,
            pieceJointe?: string | null
        }) => {
            try {
                const utilisateurId = currentUserId(socket);
                const typeMessage = data.typeMessage || "text";
                const text = String(data.message || "").trim();
                if (!await isSalonMember(data.salonId, utilisateurId)
                    || data.pieceJointe
                    || !["text", "sticker"].includes(typeMessage)
                    || !text
                    || text.length > (typeMessage === "sticker" ? 32 : 5000)) return;
                const message = await Message.create({
                    salonId: data.salonId,
                    utilisateurId,
                    message: text,
                    typeMessage,
                    pieceJointe: null
                });

                await Salon.update({
                    dernierMessage: typeMessage === "sticker" ? "🎨 Autocollant" : text,
                    dateDernierMessage: new Date()
                }, { where: { id: data.salonId } });

                io.to(`salon:${data.salonId}`).emit('new:message', message);
            } catch (error) {
                console.error('Erreur envoi message socket:', error);
            }
        });

        socket.on('typing', async (data: { salonId: string, utilisateurId?: number }) => {
            if (!await isSalonMember(data.salonId, currentUserId(socket))) return;
            socket.to(`salon:${data.salonId}`).emit('typing', {
                utilisateurId: currentUserId(socket),
                salonId: data.salonId
            });
        });

        socket.on('message:seen', async (data: { salonId: string, messageIds: number[] }) => {
            try {
                const utilisateurId = currentUserId(socket);
                if (!await isSalonMember(data.salonId, utilisateurId)) return;
                if (data.messageIds && data.messageIds.length > 0) {
                    await Message.update({ lu: true }, {
                        where: { id: data.messageIds, salonId: data.salonId, utilisateurId: { [Op.ne]: utilisateurId } }
                    });
                }
                await ParticipantSalon.update({ dateDerniereLecture: new Date() }, {
                    where: { salonId: data.salonId, utilisateurId }
                });
                io.to(`salon:${data.salonId}`).emit('messages:seen', {
                    messageIds: data.messageIds,
                    utilisateurId,
                    salonId: data.salonId
                });
            } catch (error) {
                console.error('Erreur message:seen:', error);
            }
        });

        socket.on('message:delete', async (data: { salonId: string, messageId: number }) => {
            try {
                const utilisateurId = currentUserId(socket);
                if (!await isSalonMember(data.salonId, utilisateurId)) return;
                const message = await Message.findOne({ where: { id: data.messageId, salonId: data.salonId, utilisateurId } });
                if (!message) return;
                await message.update({ estSupprime: true, message: 'Ce message a été supprimé' });
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
                const utilisateurId = currentUserId(socket);
                const newMessage = String(data.newMessage || "").trim();
                if (!await isSalonMember(data.salonId, utilisateurId) || !newMessage || newMessage.length > 5000) return;
                const message = await Message.findOne({ where: { id: data.messageId, salonId: data.salonId, utilisateurId } });
                if (!message) return;
                await message.update({ message: newMessage, estModifie: true });
                io.to(`salon:${data.salonId}`).emit('message:edited', {
                    messageId: data.messageId,
                    newMessage,
                    salonId: data.salonId
                });
            } catch (error) {
                console.error('Erreur message:edit:', error);
            }
        });

        socket.on('user:online', () => {
            const utilisateurId = currentUserId(socket);
            presenceOnline.add(utilisateurId);
            io.emit('presence', { utilisateurId, online: true });
        });

        socket.on('user:offline', () => {
            const utilisateurId = currentUserId(socket);
            presenceOnline.delete(utilisateurId);
            io.emit('presence', { utilisateurId, online: false });
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
                if (!await isSalonAdmin(data.salonId, currentUserId(socket))) return;
                const userExists = await Utilisateur.findByPk(data.utilisateurId);
                if (!userExists || await isSalonMember(data.salonId, data.utilisateurId)) return;
                const participant = await ParticipantSalon.create({
                    salonId: data.salonId,
                    utilisateurId: data.utilisateurId,
                    role: 'membre'
                });
                io.to(`salon:${data.salonId}`).emit('member:added', {
                    salonId: data.salonId,
                    participant,
                });
            } catch (error) {
                console.error('Erreur member:add:', error);
            }
        });

        socket.on('member:remove', async (data: { salonId: string, utilisateurId: number }) => {
            try {
                const currentId = currentUserId(socket);
                if (!await isSalonAdmin(data.salonId, currentId)
                    && Number(data.utilisateurId) !== currentId) return;
                await ParticipantSalon.destroy({
                    where: { salonId: data.salonId, utilisateurId: data.utilisateurId }
                });
                io.to(`salon:${data.salonId}`).emit('member:removed', {
                    salonId: data.salonId,
                    utilisateurId: data.utilisateurId
                });
                if (Number(data.utilisateurId) === currentId) {
                    io.in(`user:${currentId}`).socketsLeave(`salon:${data.salonId}`);
                }
            } catch (error) {
                console.error('Erreur member:remove:', error);
            }
        });

        socket.on('member:role', async (data: { salonId: string, utilisateurId: number, role: string }) => {
            try {
                if (!await isSalonAdmin(data.salonId, currentUserId(socket))
                    || !["admin", "membre"].includes(data.role)) return;
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