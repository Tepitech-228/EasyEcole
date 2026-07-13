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

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    const token = localStorage.getItem('token');
    this.socket = io(environment.API_URL, {
      auth: { token }
    });
    this.socket.on('new:message', (message: any) => {
      this.newMessageSubject.next(message);
    });
    this.socket.on('typing', (data: any) => {
      this.typingSubject.next(data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
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

  notifyTyping(salonId: number, utilisateurId: number): void {
    this.socket?.emit('typing', { salonId, utilisateurId });
  }

  onNewMessage(): Observable<any> {
    return this.newMessageSubject.asObservable();
  }

  onTyping(): Observable<any> {
    return this.typingSubject.asObservable();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
