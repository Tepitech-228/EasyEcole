import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';
import { SocketService } from 'src/app/core/services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-discussions-page',
  templateUrl: './discussions-page.component.html',
  styleUrls: ['./discussions-page.component.scss']
})
export class DiscussionsPageComponent extends BaseComponentClass implements OnInit, OnDestroy, AfterViewInit {
  salons: any[] = [];
  selectedSalon: any = null;
  messages: any[] = [];
  filteredMessages: any[] = [];
  searchQuery: string = '';
  showInfoPanel: boolean = false;
  showCreateModal: boolean = false;
  showStickerPicker: boolean = false;
  showNewMessageModal: boolean = false;
  newMessageUser: any = null;
  availableUsers: any[] = [];
  members: any[] = [];
  typingUsers: string[] = [];
  presence: Map<number, boolean> = new Map();
  loading: boolean = false;
  currentUserName: string = '';
  currentUserId: number = 0;
  page: number = 1;
  hasMoreMessages: boolean = true;
  loadingMessages: boolean = false;
  activeTab: string = 'messagerie';

  private socketSubscriptions: Subscription[] = [];
  private chatApi = environment.API_MODULES.ELEARNING + '/chat';

  constructor(private http: HttpClient, protected socketService: SocketService, private route: ActivatedRoute) {
    super();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  get filteredSalons(): any[] {
    if (!this.searchQuery.trim()) return this.salons;
    const q = this.searchQuery.toLowerCase();
    return this.salons.filter(s => s.titre?.toLowerCase().includes(q));
  }

  ngOnInit(): void {
    this.currentUserName =
      `${BaseComponentClass.utilisateur.prenoms || ''} ${BaseComponentClass.utilisateur.nom || ''}`.trim() ||
      'Moi';
    this.currentUserId = this.normalizeUserId(BaseComponentClass.utilisateur.id);
    this.socketService.connect();
    this.socketService.notifyOnline(this.currentUserId);
    this.loadUsers();
    this.loadSalons();
    this.subscribeToSockets();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(s => s.unsubscribe());
    if (this.selectedSalon) {
      this.socketService.leaveSalon(this.selectedSalon.id);
    }
    this.socketService.notifyOffline(this.currentUserId);
    this.socketService.disconnect();
  }

  private subscribeToSockets(): void {
    this.socketSubscriptions.push(
      this.socketService.onNewMessage().subscribe((message: any) => {
        if (this.selectedSalon && message.salonId === this.selectedSalon.id) {
          this.messages = [...this.messages, this.enrichMessage(message)];
          this.markAsSeenIfActive(message);
        }
        const idx = this.salons.findIndex(s => s.id === message.salonId);
        if (idx >= 0) {
          const salon = this.salons[idx];
          salon.dernierMessage = message;
          this.salons.splice(idx, 1);
          this.salons.unshift(salon);
        }
      })
    );
    this.socketSubscriptions.push(
      this.socketService.onTyping().subscribe((data: any) => {
        this.handleTypingEvent(data);
      })
    );
    this.socketSubscriptions.push(
      this.socketService.onPresenceChange().subscribe((data: any) => {
        if (data.utilisateurId) {
          this.presence.set(data.utilisateurId, data.online);
          this.updateMemberOnlineStatus(data.utilisateurId, data.online);
        }
      })
    );
    this.socketSubscriptions.push(
      this.socketService.onMessagesSeen().subscribe((data: any) => {
        if (data.messageIds && this.selectedSalon?.id === data.salonId) {
          this.messages = this.messages.map(m =>
            data.messageIds.includes(m.id) ? { ...m, lu: true } : m
          );
        }
      })
    );
    this.socketSubscriptions.push(
      this.socketService.onMessageDeleted().subscribe((data: any) => {
        if (this.selectedSalon?.id === data.salonId) {
          this.messages = this.messages.filter(m => m.id !== data.messageId);
        }
      })
    );
    this.socketSubscriptions.push(
      this.socketService.onMessageEdited().subscribe((data: any) => {
        if (this.selectedSalon?.id === data.salonId) {
          this.messages = this.messages.map(m =>
            m.id === data.messageId ? { ...m, message: data.newMessage } : m
          );
        }
      })
    );
  }

  loadUsers(): void {
    this.http.get(`${environment.API_URL}/auth/utilisateurs`).subscribe({
      next: (data: any) => {
        this.availableUsers = (data || []).filter(
          (u: any) => this.normalizeUserId(u.id) !== null
        );
      }
    });
  }

  loadSalons(): void {
    this.loading = true;
    this.http.get(`${this.chatApi}/mes-salons`).subscribe({
      next: (data: any) => {
        this.salons = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectSalon(salon: any): void {
    if (this.selectedSalon) {
      this.socketService.leaveSalon(this.selectedSalon.id);
    }
    this.selectedSalon = salon;
    this.messages = [];
    this.page = 1;
    this.hasMoreMessages = true;
    this.showInfoPanel = false;
    this.showStickerPicker = false;
    this.typingUsers = [];
    this.socketService.joinSalon(salon.id);
    this.loadMessages(salon.id);
    this.loadSalonMembers(salon);
    this.loadSalonDetails(salon.id);
  }

  loadSalonDetails(salonId: number): void {
    this.http.get(`${this.chatApi}/salons/${salonId}`).subscribe({
      next: (data: any) => {
        if (this.selectedSalon?.id === salonId) {
          this.selectedSalon = { ...this.selectedSalon, ...data };
        }
      }
    });
  }

  loadMessages(salonId: number): void {
    this.loadingMessages = true;
    let url = `${this.chatApi}/salons/${salonId}/messages?limit=50`;
    if (this.page > 1 && this.messages.length > 0) {
        const beforeDate = this.messages[0]?.date;
        if (beforeDate) {
            url += `&before=${encodeURIComponent(beforeDate)}`;
        }
    }
    this.http.get(url).subscribe({
        next: (data: any) => {
            const msgs = (data?.data || data || []).map((m: any) => this.enrichMessage(m));
            if (this.page === 1) {
                this.messages = msgs;
            } else {
                this.messages = [...msgs, ...this.messages];
            }
            this.hasMoreMessages = msgs.length >= 50;
            this.loadingMessages = false;
            this.markAsSeenIfActive();
        },
        error: () => {
            this.loadingMessages = false;
        }
    });
  }

  loadMoreMessages(): void {
    if (!this.hasMoreMessages || this.loadingMessages || !this.selectedSalon) return;
    this.page++;
    this.loadMessages(this.selectedSalon.id);
  }

  loadSalonMembers(salon: any): void {
    this.http
      .get(`${this.chatApi}/salons/${salon.id}/participants`)
      .subscribe({
        next: (data: any) => {
          const participants = data || [];
          this.members = participants.map((p: any) => {
            const user = this.availableUsers.find(
              u => this.normalizeUserId(u.id) === this.normalizeUserId(p.utilisateurId || p.id)
            );
            return {
              id: this.normalizeUserId(p.utilisateurId || p.id),
              name: user
                ? `${user.prenoms || ''} ${user.nom || ''}`.trim()
                : `Membre ${p.utilisateurId || p.id}`,
              role: p.role || 'Membre',
              online: this.presence.get(this.normalizeUserId(p.utilisateurId || p.id)) || false
            };
          });
          if (
            this.currentUserId &&
            !this.members.some(m => m.id === this.currentUserId)
          ) {
            this.members.unshift({
              id: this.currentUserId,
              name: this.currentUserName || 'Moi',
              role: 'Vous',
              online: true
            });
          }
        }
      });
  }

  sendMessage(text: string): void {
    if (!text.trim() || !this.selectedSalon) return;
    this.socketService.sendMessage(this.selectedSalon.id, text.trim(), this.currentUserId);
  }

  sendMediaMessage(data: { message: string; typeMessage: string; pieceJointe: string | null }): void {
    if (!this.selectedSalon) return;
    this.socketService.sendMediaMessage(
      this.selectedSalon.id,
      data.message,
      this.currentUserId,
      data.typeMessage,
      data.pieceJointe || null
    );
  }

  sendSticker(emoji: string): void {
    if (!this.selectedSalon) return;
    this.socketService.sendMediaMessage(
      this.selectedSalon.id,
      emoji,
      this.currentUserId,
      'sticker',
      null
    );
    this.showStickerPicker = false;
  }

  notifyTyping(): void {
    if (!this.selectedSalon) return;
    this.socketService.notifyTyping(this.selectedSalon.id, this.currentUserId);
  }

  createGroup(event: { titre: string; participants: number[] }): void {
    this.http.post(`${this.chatApi}/salons`, {
      titre: event.titre,
      type: 'groupe',
      participants: event.participants
    }).subscribe({
      next: (salon: any) => {
        this.salons = [salon, ...this.salons];
        this.showCreateModal = false;
        this.selectSalon(salon);
      }
    });
  }

  deleteMessage(messageId: number): void {
    if (!this.selectedSalon) return;
    this.socketService.deleteMessage(this.selectedSalon.id, messageId);
  }

  editMessage(event: { id: number; message: string }): void {
    if (!this.selectedSalon) return;
    const newText = prompt('Modifier le message:', event.message);
    if (newText && newText.trim()) {
      this.socketService.editMessage(this.selectedSalon.id, event.id, newText.trim());
    }
  }

  promoteMember(userId: number): void {
    if (!this.selectedSalon) return;
    this.http
      .put(`${this.chatApi}/salons/${this.selectedSalon.id}/participants/${userId}/role`, { role: 'admin' })
      .subscribe(() => this.loadSalonMembers(this.selectedSalon));
  }

  demoteMember(userId: number): void {
    if (!this.selectedSalon) return;
    this.http
      .put(`${this.chatApi}/salons/${this.selectedSalon.id}/participants/${userId}/role`, { role: 'membre' })
      .subscribe(() => this.loadSalonMembers(this.selectedSalon));
  }

  removeMember(userId: number): void {
    if (!this.selectedSalon) return;
    this.http
      .delete(`${this.chatApi}/salons/${this.selectedSalon.id}/participants/${userId}`)
      .subscribe(() => this.loadSalonMembers(this.selectedSalon));
  }

  addMember(userId: number): void {
    if (!this.selectedSalon) return;
    this.http
      .post(`${this.chatApi}/salons/${this.selectedSalon.id}/participants`, { utilisateurId: userId })
      .subscribe({
        next: () => {
          this.loadSalonMembers(this.selectedSalon);
          this.socketService.addMember(this.selectedSalon.id, userId, this.currentUserId);
        },
        error: (err) => {
          console.error('Erreur ajout membre:', err);
          alert('Erreur lors de l\'ajout du membre');
        }
      });
  }

  generateInvite(): void {
    if (!this.selectedSalon) return;
    this.http.post(`${this.chatApi}/salons/${this.selectedSalon.id}/inviter`, {}).subscribe({
        next: (res: any) => {
            const lien = res.lien;
            navigator.clipboard.writeText(lien).then(() => {
                alert('Lien d\'invitation copié dans le presse-papier !');
            });
        },
        error: () => {
            alert('Erreur lors de la génération du lien d\'invitation');
        }
    });
  }

  leaveGroup(): void {
    if (!this.selectedSalon || !this.currentUserId) return;
    if (confirm('Quitter ce groupe ?')) {
      this.http
        .delete(`${this.chatApi}/salons/${this.selectedSalon.id}/participants/${this.currentUserId}`)
        .subscribe({
          next: () => {
            this.salons = this.salons.filter(s => s.id !== this.selectedSalon.id);
            this.selectedSalon = null;
            this.messages = [];
            this.showInfoPanel = false;
          }
        });
    }
  }

  get estAdmin(): boolean {
    return this.members.some(
      m => m.id === this.currentUserId && (m.role === 'Admin' || m.role === 'admin')
    );
  }

  isCurrentUserAdmin(): boolean {
    return this.estAdmin;
  }

  private markAsSeenIfActive(message?: any): void {
    if (!this.selectedSalon || !this.currentUserId) return;
    const unreadIds = (message ? [message] : this.messages)
      .filter(m => m.utilisateurId !== this.currentUserId && !m.lu)
      .map(m => m.id)
      .filter(id => id != null);
    if (unreadIds.length > 0) {
      this.socketService.markAsSeen(this.selectedSalon.id, unreadIds, this.currentUserId);
    }
  }

  private updateMemberOnlineStatus(userId: number, online: boolean): void {
    const idx = this.members.findIndex(m => m.id === userId);
    if (idx >= 0) {
      this.members[idx] = { ...this.members[idx], online };
    }
  }

  private enrichMessage(message: any): any {
    const authorId = this.normalizeUserId(message.utilisateurId);
    const matchedUser = this.availableUsers.find(
      u => this.normalizeUserId(u.id) === authorId
    );
    const authorName = matchedUser
      ? `${matchedUser.prenoms || ''} ${matchedUser.nom || ''}`.trim()
      : authorId === this.currentUserId
        ? this.currentUserName
        : `Membre ${authorId || ''}`;
    return {
      ...message,
      authorName: authorName || 'Participant',
      lu: message.lu || false
    };
  }

  private handleTypingEvent(data: any): void {
    if (!data || !data.utilisateurId || data.utilisateurId === this.currentUserId) return;
    const user = this.availableUsers.find(
      u => this.normalizeUserId(u.id) === this.normalizeUserId(data.utilisateurId)
    );
    const name = user
      ? `${user.prenoms || ''} ${user.nom || ''}`.trim()
      : 'Un participant';
    if (!this.typingUsers.includes(name)) {
      this.typingUsers = [...this.typingUsers, name];
    }
    window.setTimeout(() => {
      this.typingUsers = this.typingUsers.filter(n => n !== name);
    }, 1200);
  }

  ngAfterViewInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
        this.rejoindreSalon(code);
    }
  }

  rejoindreSalon(code: string): void {
    this.http.post(`${this.chatApi}/salons/rejoindre/${code}`, {}).subscribe({
        next: (res: any) => {
            if (res.salon) {
                this.loadSalons();
                this.selectSalon(res.salon);
            }
        },
        error: () => {
            alert('Lien d\'invitation invalide ou expiré');
        }
    });
  }

  public normalizeUserId(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  startNewPrivateMessage(user: any): void {
    this.newMessageUser = user;
    this.showNewMessageModal = false;
    const existing = this.salons.find(s =>
      s.type === 'discussion' &&
      s.participants?.some((p: any) => this.normalizeUserId(p) === this.normalizeUserId(user.id))
    );
    if (existing) {
      this.selectSalon(existing);
    } else {
      this.http.post(`${this.chatApi}/salons`, {
        titre: user.prenoms ? `${user.prenoms} ${user.nom}` : user.nom || `Discussion avec #${user.id}`,
        type: 'discussion',
        participants: [this.currentUserId, user.id]
      }).subscribe({
        next: (salon: any) => {
          this.salons = [salon, ...this.salons];
          this.selectSalon(salon);
        }
      });
    }
  }
}
