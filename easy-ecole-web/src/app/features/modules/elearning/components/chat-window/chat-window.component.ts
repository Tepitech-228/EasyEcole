import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html'
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @Input() salon: any;
  messages: any[] = [];
  messageText = '';
  socket: Socket | null = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.socket = io(environment.API_URL);
    this.loadMessages();

    if (this.socket) {
      this.socket.emit('join:salon', this.salon.id);
      this.socket.on('new:message', (message: any) => {
        this.messages.push(message);
      });
      this.socket.on('typing', (data: any) => {
        console.log('User typing:', data);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.emit('leave:salon', this.salon.id);
      this.socket.disconnect();
    }
  }

  loadMessages(): void {
    this.http.get(`${environment.API_URL}/elearning/chat/salons/${this.salon.id}/messages`).subscribe({
      next: (data: any) => this.messages = data
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;

    if (this.socket) {
      this.socket.emit('send:message', {
        salonId: this.salon.id,
        message: this.messageText,
        utilisateurId: 1
      });
    }
    this.messageText = '';
  }
}

