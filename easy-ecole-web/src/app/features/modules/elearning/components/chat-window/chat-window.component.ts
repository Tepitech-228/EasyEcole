import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SocketService } from 'src/app/core/services/socket.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @Input() salon: any;
  messages: any[] = [];
  messageText = '';
  currentUserId: number | null = null;
  currentUserName = '';
  typingUsers: string[] = [];
  members: any[] = [];
  availableUsers: any[] = [];
  private socketSubscriptions: Subscription[] = [];

  constructor(private http: HttpClient, private socketService: SocketService) { }

  ngOnInit(): void {
    this.currentUserId = this.normalizeUserId(BaseComponentClass.utilisateur.id);
    this.currentUserName = `${BaseComponentClass.utilisateur.prenoms || ''} ${BaseComponentClass.utilisateur.nom || ''}`.trim() || 'Moi';
    this.socketService.connect();
    this.socketService.joinSalon(this.salon.id);
    this.loadUsers();
    this.loadMessages();

    this.socketSubscriptions.push(
      this.socketService.onNewMessage().subscribe((message: any) => {
        this.messages.push(message);
      })
    );
    this.socketSubscriptions.push(
      this.socketService.onTyping().subscribe((data: any) => {
        this.handleTypingEvent(data);
      })
    );
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(s => s.unsubscribe());
    this.socketService.leaveSalon(this.salon.id);
    this.socketService.disconnect();
  }

  loadUsers(): void {
    this.http.get(`${environment.API_URL}/auth/utilisateurs`).subscribe({
      next: (data: any) => {
        this.availableUsers = (data || []).filter((u: any) => this.normalizeUserId(u.id) !== null || u.identifiant || u.email || u.nom);
        this.loadSalonMembers();
      }
    });
  }

  loadMessages(): void {
    this.http.get(`${environment.API_URL}/elearning/chat/salons/${this.salon.id}/messages`).subscribe({
      next: (data: any) => this.messages = data
    });
  }

  loadSalonMembers(): void {
    if (!this.salon?.participants) {
      this.members = this.currentUserId ? [{ id: this.currentUserId, name: this.currentUserName, role: 'Vous', online: true }] : [];
      return;
    }

    const participantIds = (this.salon.participants || [])
      .map((p: any) => this.normalizeUserId(p.utilisateurId))
      .filter((id: any): id is number => id !== null);

    const members = participantIds.map((id: number) => {
      const user = this.availableUsers.find((c) => this.normalizeUserId(c.id) === id);
      return {
        id,
        name: user ? `${user.prenoms || ''} ${user.nom || ''}`.trim() : `Membre ${id}`,
        role: user ? (user.role || 'Membre') : 'Membre',
        online: true
      };
    });

    if (this.currentUserId !== null && !members.some((m) => m.id === this.currentUserId)) {
      members.unshift({ id: this.currentUserId, name: this.currentUserName || 'Moi', role: 'Vous', online: true });
    }

    this.members = members;
  }

  sendMessage(): void {
    if (!this.messageText.trim()) return;

    this.socketService.sendMessage(this.salon.id, this.messageText, this.currentUserId || 1);
    this.messageText = '';
  }

  notifyTyping(): void {
    this.socketService.notifyTyping(this.salon.id, this.currentUserId || 1);
  }

  isOwnMessage(utilisateurId: any): boolean {
    return this.normalizeUserId(utilisateurId) === this.currentUserId;
  }

  private handleTypingEvent(data: any): void {
    if (!data || !data.utilisateurId || this.normalizeUserId(data.utilisateurId) === this.currentUserId) return;

    const matched = this.availableUsers.find((u) => this.normalizeUserId(u.id) === this.normalizeUserId(data.utilisateurId));
    const authorName = matched ? `${matched.prenoms || ''} ${matched.nom || ''}`.trim() : 'Un participant';

    if (!this.typingUsers.includes(authorName)) {
      this.typingUsers = [...this.typingUsers, authorName];
    }

    window.setTimeout(() => {
      this.typingUsers = this.typingUsers.filter((name) => name !== authorName);
    }, 1200);
  }

  private normalizeUserId(value: any): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
