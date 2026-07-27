import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {
  coursId: string | null = null;
  salons: any[] = [];
  selectedSalon: any = null;
  loading = false;

  showCreateModal = false;
  salonTitre = '';
  filterRole = '';
  availableUsers: any[] = [];
  selectedParticipantIds = new Set<number>();

  readonly roleLabels: Record<string, string> = {
    APPRENANT: 'Étudiants',
    ENSEIGNANT: 'Enseignants',
    INSTITUTION: 'Institution',
    PARENT: 'Parents',
    ADMIN: 'Administrateurs',
    CAISSIER_BANQUE: 'Caissier/Banque',
    RESSOURCES_HUMAINES: 'Ressources Humaines',
    CABINET_COMPTABLE: 'Cabinet Comptable',
    COMITE_ORIENTATION: "Comité d'Orientation"
  };

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.coursId = this.route.snapshot.paramMap.get('id');
    this.loadSalons();
  }

  loadSalons(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/chat/salons`).subscribe({
      next: (data: any) => {
        this.salons = data.filter((s: any) => !this.coursId || s.coursId == this.coursId);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  selectSalon(salon: any): void {
    this.selectedSalon = salon;
  }

  openCreateModal(): void {
    this.salonTitre = '';
    this.filterRole = '';
    this.selectedParticipantIds.clear();
    this.showCreateModal = true;
    this.http.get(`${environment.API_URL}/auth/utilisateurs`).subscribe({
      next: (data: any) => this.availableUsers = data || []
    });
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  toggleParticipant(id: number): void {
    if (this.selectedParticipantIds.has(id)) {
      this.selectedParticipantIds.delete(id);
    } else {
      this.selectedParticipantIds.add(id);
    }
  }

  get groupedUsers(): { role: string; label: string; users: any[] }[] {
    const filtered = this.filterRole
      ? this.availableUsers.filter((u: any) => u.role === this.filterRole)
      : this.availableUsers;
    const groups = new Map<string, any[]>();
    for (const u of filtered) {
      const key = u.role || 'AUTRE';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(u);
    }
    return Array.from(groups.entries())
      .map(([role, users]) => ({ role, label: this.roleLabels[role] || role, users }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  createSalon(): void {
    if (!this.salonTitre.trim()) return;
    this.http.post(`${environment.API_URL}/elearning/chat/salons`, {
      titre: this.salonTitre,
      type: 'groupe',
      participants: Array.from(this.selectedParticipantIds)
    }).subscribe({
      next: (salon: any) => {
        this.salons = [salon, ...this.salons];
        this.closeCreateModal();
        this.selectedSalon = salon;
      },
      error: (err) => {
        console.error('Erreur création salon:', err);
        alert("Erreur lors de la création du salon");
      }
    });
  }
}

