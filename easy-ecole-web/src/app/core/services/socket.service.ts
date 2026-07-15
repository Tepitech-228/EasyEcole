import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private newMessageSubject = new Subject<any>();
  private typingSubject = new Subject<any>();
  private messagesSeenSubject = new Subject<any>();
  private presenceSubject = new Subject<any>();
  private messageDeletedSubject = new Subject<any>();
  private messageEditedSubject = new Subject<any>();
  private memberAddedSubject = new Subject<any>();
  private memberRemovedSubject = new Subject<any>();
  private memberRoleChangedSubject = new Subject<any>();
  estConnecte: boolean = false;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    const token = localStorage.getItem('_token') || localStorage.getItem('token');
    this.socket = io(environment.API_URL, {
      auth: { token }
    });
    this.socket.on('new:message', (message: any) => {
      this.newMessageSubject.next(message);
    });
    this.socket.on('typing', (data: any) => {
      this.typingSubject.next(data);
    });
    this.socket.on('presence', (data: any) => {
      this.presenceSubject.next(data);
    });
    this.socket.on('message:deleted', (data: any) => {
      this.messageDeletedSubject.next(data);
    });
    this.socket.on('message:edited', (data: any) => {
      this.messageEditedSubject.next(data);
    });
    this.socket.on('messages:seen', (data: any) => {
      this.messagesSeenSubject.next(data);
    });
    this.socket.on('member:added', (data: any) => {
      this.memberAddedSubject.next(data);
    });
    this.socket.on('member:removed', (data: any) => {
      this.memberRemovedSubject.next(data);
    });
    this.socket.on('member:roleChanged', (data: any) => {
      this.memberRoleChangedSubject.next(data);
    });
    this.estConnecte = true;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.estConnecte = false;
  }

  joinSalon(salonId: number): void {
    this.socket?.emit('join:salon', salonId);
  }

  leaveSalon(salonId: number): void {
    this.socket?.emit('leave:salon', salonId);
  }

  sendMessage(salonId: number, message: string, utilisateurId: number): void {
    this.socket?.emit('send:message', { salonId, message, utilisateurId });
  }

  sendMediaMessage(salonId: number, message: string, utilisateurId: number, typeMessage: string, pieceJointe: string | null): void {
    this.socket?.emit('send:message', { salonId, message, utilisateurId, typeMessage, pieceJointe });
  }

  notifyTyping(salonId: number, utilisateurId: number): void {
    this.socket?.emit('typing', { salonId, utilisateurId });
  }

  notifyOnline(utilisateurId: number): void {
    this.socket?.emit('user:online', { utilisateurId });
  }

  notifyOffline(utilisateurId: number): void {
    this.socket?.emit('user:offline', { utilisateurId });
  }

  markAsSeen(salonId: number, messageIds: number[], utilisateurId: number): void {
    this.socket?.emit('message:seen', { salonId, messageIds, utilisateurId });
  }

  deleteMessage(salonId: number, messageId: number): void {
    this.socket?.emit('message:delete', { salonId, messageId });
  }

  editMessage(salonId: number, messageId: number, newMessage: string): void {
    this.socket?.emit('message:edit', { salonId, messageId, newMessage });
  }

  addMember(salonId: number, utilisateurId: number, addedBy: number): void {
    this.socket?.emit('member:add', { salonId, utilisateurId, addedBy });
  }

  removeMember(salonId: number, utilisateurId: number): void {
    this.socket?.emit('member:remove', { salonId, utilisateurId });
  }

  changeMemberRole(salonId: number, utilisateurId: number, role: string): void {
    this.socket?.emit('member:role', { salonId, utilisateurId, role });
  }

  onNewMessage(): Observable<any> {
    return this.newMessageSubject.asObservable();
  }

  onTyping(): Observable<any> {
    return this.typingSubject.asObservable();
  }

  onPresenceChange(): Observable<any> {
    return this.presenceSubject.asObservable();
  }

  onMessagesSeen(): Observable<any> {
    return this.messagesSeenSubject.asObservable();
  }

  onMessageDeleted(): Observable<any> {
    return this.messageDeletedSubject.asObservable();
  }

  onMessageEdited(): Observable<any> {
    return this.messageEditedSubject.asObservable();
  }

  onMemberAdded(): Observable<any> {
    return this.memberAddedSubject.asObservable();
  }

  onMemberRemoved(): Observable<any> {
    return this.memberRemovedSubject.asObservable();
  }

  onMemberRoleChanged(): Observable<any> {
    return this.memberRoleChangedSubject.asObservable();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
