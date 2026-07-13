import { Server as SocketIOServer, Socket } from "socket.io";
import { Message } from "../models/Message";

export const setupChatSocket = (io: SocketIOServer): void => {

    io.on('connection', (socket: Socket) => {
        console.log(`Utilisateur connecté au chat: ${socket.id}`);

        socket.on('join:salon', (salonId: string) => {
            socket.join(`salon:${salonId}`);
            console.log(`Socket ${socket.id} a rejoint le salon ${salonId}`);
        });

        socket.on('send:message', async (data: { salonId: string, message: string, utilisateurId: number }) => {
            try {
                const message = await Message.create({
                    salonId: data.salonId,
                    utilisateurId: data.utilisateurId,
                    message: data.message
                });

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

        socket.on('leave:salon', (salonId: string) => {
            socket.leave(`salon:${salonId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Utilisateur déconnecté du chat: ${socket.id}`);
        });
    });
};
