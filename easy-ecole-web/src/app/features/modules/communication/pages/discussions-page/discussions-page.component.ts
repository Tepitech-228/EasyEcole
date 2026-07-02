import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-discussions-page',
  templateUrl: './discussions-page.component.html',
  styleUrls: ['./discussions-page.component.scss']
})
export class DiscussionsPageComponent extends BaseComponentClass implements OnInit, OnDestroy {
  salons: any[] = [];
  selectedSalon: any = null;
  messages: any[] = [];
  messageText = '';
  newSalonTitle = '';
  newSalonType = 'groupe';
  selectedParticipants: number[] = [];
  availableUsers: any[] = [];
  loading = false;
  creating = false;
  currentUserName = '';
  currentUserId: number | null = null;
  socket: Socket | null = null;
  typingUsers: string[] = [];
  members: any[] = [
    { id: 1, name: 'Moi', role: 'Admin', online: true },
    { id: 2, name: 'Prof. Martin', role: 'Enseignant', online: true },
    { id: 3, name: 'A. Demba', role: 'Étudiant', online: false }
  ];

  constructor(private http: HttpClient) {
    super();
  }

  ngOnInit(): void {
    this.currentUserName = `${BaseComponentClass.utilisateur.prenoms || ''} ${BaseComponentClass.utilisateur.nom || ''}`.trim() || 'Moi';
    this.currentUserId = this.normalizeUserId(BaseComponentClass.utilisateur.id);
    this.loadUsers();
    this.loadSalons();
  }

  ngOnDestroy(): void {
    if (this.selectedSalon && this.socket) {
      this.socket.emit('leave:salon', this.selectedSalon.id);
      this.socket.disconnect();
    }
  }

  loadUsers(): void {
    this.http.get(`${environment.API_URL}/auth/utilisateurs`).subscribe({
      next: (data: any) => {
        this.availableUsers = (data || []).filter((u: any) => this.normalizeUserId(u.id) !== null || u.identifiant || u.email || u.nom);
      }
    });
  }

  loadSalons(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/chat/salons`).subscribe({
      next: (data: any) => {
        this.salons = data || [];
        if (!this.selectedSalon && this.salons.length > 0) {
          this.selectSalon(this.salons[0]);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectSalon(salon: any): void {
    if (this.socket && this.selectedSalon) {
      this.socket.emit('leave:salon', this.selectedSalon.id);
      this.socket.disconnect();
    }

    this.selectedSalon = salon;
    this.messages = [];
    this.messageText = '';
    this.members = [];
    this.connectSocket();
    this.loadMessages(salon.id);
    this.loadSalonMembers(salon);
  }

  connectSocket(): void {
    if (!this.selectedSalon) {
      return;
    }

    this.socket = io(environment.API_URL);
    this.socket.emit('join:salon', this.selectedSalon.id);
    this.socket.on('new:message', (message: any) => {
      this.messages = [...this.messages, this.enrichMessage(message)];
    });
    this.socket.on('typing', (data: any) => {
      this.handleTypingEvent(data);
    });
  }

  loadMessages(salonId: number): void {
    this.http.get(`${environment.API_URL}/elearning/chat/salons/${salonId}/messages`).subscribe({
      next: (data: any) => {
        this.messages = (data || []).map((message: any) => this.enrichMessage(message));
      }
    });
  }

  createSalon(): void {
    if (!this.newSalonTitle.trim()) {
      return;
    }

    this.creating = true;
    const participants = [...this.selectedParticipants];
    if (this.currentUserId !== null) {
      participants.push(this.currentUserId);
    }

    const uniqueParticipantIds = [...new Set(participants.filter((id): id is number => id !== null))];

    this.http.post(`${environment.API_URL}/elearning/chat/salons`, {
      coursId: 1,
      titre: this.newSalonTitle.trim(),
      type: this.newSalonType
    }).subscribe({
      next: (salon: any) => {
        const createdSalon = salon;
        uniqueParticipantIds.forEach((id) => {
          this.http.post(`${environment.API_URL}/elearning/chat/salons/${createdSalon.id}/participants`, { utilisateurId: id }).subscribe();
        });

        this.salons = [createdSalon, ...this.salons];
        this.selectedSalon = createdSalon;
        this.messageText = '';
        this.messages = [];
        this.newSalonTitle = '';
        this.selectedParticipants = [];
        this.creating = false;
        this.connectSocket();
        this.loadMessages(createdSalon.id);
        this.loadSalonMembers(createdSalon);
      },
      error: () => {
        this.creating = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedSalon) {
      return;
    }

    const payload = {
      salonId: this.selectedSalon.id,
      message: this.messageText.trim(),
      utilisateurId: this.currentUserId || 1
    };

    if (this.socket) {
      this.socket.emit('send:message', payload);
    }

    this.messageText = '';
  }

  notifyTyping(): void {
    if (!this.selectedSalon || !this.socket) {
      return;
    }

    this.socket.emit('typing', {
      salonId: this.selectedSalon.id,
      utilisateurId: this.currentUserId || 1
    });
  }

  loadSalonMembers(salon: any): void {
    const participantIds = (salon.participants || [])
      .map((participant: any) => this.normalizeUserId(participant.utilisateurId))
      .filter((id): id is number => id !== null);

    const members = participantIds.map((id: number) => {
      const user = this.availableUsers.find((candidate) => this.normalizeUserId(candidate.id) === id);
      return {
        id,
        name: user ? `${user.prenoms || ''} ${user.nom || ''}`.trim() : `Membre ${id}`,
        role: user ? (user.role || 'Membre') : 'Membre',
        online: true
      };
    });

    if (this.currentUserId !== null && !members.some((member) => member.id === this.currentUserId)) {
      members.unshift({
        id: this.currentUserId,
        name: this.currentUserName || 'Moi',
        role: 'Vous',
        online: true
      });
    }

    this.members = members;
  }

  toggleParticipant(user: any): void {
    const userId = this.normalizeUserId(user.id ?? user.identifiant ?? user.email ?? user.nom);
    if (userId === null) {
      return;
    }

    const exists = this.selectedParticipants.includes(userId);
    this.selectedParticipants = exists
      ? this.selectedParticipants.filter((id) => id !== userId)
      : [...this.selectedParticipants, userId];
  }

  isUserSelected(user: any): boolean {
    const userId = this.normalizeUserId(user.id ?? user.identifiant ?? user.email ?? user.nom);
    return userId !== null && this.selectedParticipants.includes(userId);
  }

  private enrichMessage(message: any): any {
    const authorId = this.normalizeUserId(message.utilisateurId);
    const matchedUser = this.availableUsers.find((user) => this.normalizeUserId(user.id) === authorId);
    const authorName = matchedUser
      ? `${matchedUser.prenoms || ''} ${matchedUser.nom || ''}`.trim()
      : (authorId === this.currentUserId ? this.currentUserName : `Membre ${authorId || ''}`);

    return {
      ...message,
      authorName: authorName || 'Participant'
    };
  }

  private handleTypingEvent(data: any): void {
    if (!data || !data.utilisateurId || data.utilisateurId === this.currentUserId) {
      return;
    }

    const authorName = this.availableUsers.find((user) => this.normalizeUserId(user.id) === this.normalizeUserId(data.utilisateurId))
      ? `${this.availableUsers.find((user) => this.normalizeUserId(user.id) === this.normalizeUserId(data.utilisateurId))?.prenoms || ''} ${this.availableUsers.find((user) => this.normalizeUserId(user.id) === this.normalizeUserId(data.utilisateurId))?.nom || ''}`.trim()
      : 'Un participant';

    this.typingUsers = this.typingUsers.includes(authorName) ? this.typingUsers : [...this.typingUsers, authorName];
    window.setTimeout(() => {
      this.typingUsers = this.typingUsers.filter((name) => name !== authorName);
    }, 1200);
  }

  public normalizeUserId(value: any): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
