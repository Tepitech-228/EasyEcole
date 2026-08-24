import { Component, OnInit } from '@angular/core';
import { DemandeReorientation } from 'src/app/data/modules/scolarite/models/DemandeReorientation.model';
import { DemandeReorientationService } from 'src/app/data/modules/scolarite/services/demande-reorientation.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';

@Component({
  selector: 'app-reorientation-page',
  templateUrl: './reorientation-page.component.html',
  styleUrls: ['./reorientation-page.component.scss']
})
export class ReorientationPageComponent extends BaseComponentClass implements OnInit {
  items: DemandeReorientation[] = [];
  _items: DemandeReorientation[] = [];
  loading: boolean = false;
  adding: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchQuery: string = '';

  parcoursList: Parcours[] = [];
  cursusList: CursusApprenant[] = [];
  dataLoaded: boolean = false;

  selectedCursusId: string = '';
  selectedParcoursCibleId: string = '';
  motif: string = '';

  currentPage: number = 1;
  pageSize: number = 15;

  constructor(
    private service: DemandeReorientationService,
    private parcoursService: ParcoursService,
    private cursusApprenantService: CursusApprenantService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadItems();
    this.loadSelects();
  }

  private loadSelects(): void {
    this.parcoursService.getAll().subscribe(data => this.parcoursList = data);
    this.cursusApprenantService.getAll().subscribe({
      next: (data) => { this.cursusList = data; this.dataLoaded = true; },
      error: () => this.dataLoaded = true
    });
  }

  get paginatedItems(): DemandeReorientation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._items.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this._items.length / this.pageSize) || 1;
  }

  get peutSoumettre(): boolean {
    return !!(this.selectedCursusId && this.selectedParcoursCibleId && this.motif.trim());
  }

  loadItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll().subscribe({
      next: (data) => {
        this.items = data;
        this._items = [...this.items];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement';
        this.loading = false;
      }
    });
  }

  createItem(): void {
    if (!this.peutSoumettre) return;
    const cursus = this.cursusList.find(c => String(c.id) === String(this.selectedCursusId));
    const payload: DemandeReorientation = {
      cursusApprenantId: Number(this.selectedCursusId),
      parcoursActuelId: Number((cursus as any)?.parcoursId ?? (cursus as any)?.parcours?.id ?? 0),
      parcoursCibleId: Number(this.selectedParcoursCibleId),
      motif: this.motif.trim()
    };
    this.adding = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.service.create(payload).subscribe({
      next: () => {
        this.selectedCursusId = '';
        this.selectedParcoursCibleId = '';
        this.motif = '';
        this.successMessage = 'Demande soumise avec succès';
        this.adding = false;
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la soumission';
        this.adding = false;
      }
    });
  }

  traiter(s: DemandeReorientation, statut: string): void {
    if (!s.id) return;
    this.service.traiter(s.id, statut, 1).subscribe({
      next: () => {
        this.successMessage = 'Demande traitée avec succès';
        this.loadItems();
      },
      error: () => this.errorMessage = 'Erreur lors du traitement'
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    const q = this.searchQuery.toLowerCase().trim();
    this._items = this.items.filter(s => {
      if (!q) return true;
      return (
        s.motif?.toLowerCase().includes(q) ||
        this.etudiantLabel(s).toLowerCase().includes(q) ||
        this.parcoursTitre(s.parcoursActuelId).toLowerCase().includes(q) ||
        this.parcoursTitre(s.parcoursCibleId).toLowerCase().includes(q)
      );
    });
  }

  // ── Helpers d'affichage ──

  etudiantLabel(s: DemandeReorientation): string {
    const c = this.cursusList.find(x => String(x.id) === String(s.cursusApprenantId));
    const u: any = c?.utilisateur;
    if (u?.nom || u?.prenoms) return `${u.nom ?? ''} ${u.prenoms ?? ''}`.trim();
    return `Cursus #${s.cursusApprenantId}`;
  }

  cursusLabel(c: CursusApprenant): string {
    const u: any = c?.utilisateur;
    if (u?.nom || u?.prenoms) return `${u.nom ?? ''} ${u.prenoms ?? ''}`.trim();
    return `Cursus #${c.id}`;
  }

  parcoursTitre(id: number | undefined | null): string {
    if (!id) return '—';
    return this.parcoursList.find(p => String(p.id) === String(id))?.titre || `#${id}`;
  }

  parcoursActuelDuCursus(cursusId: string | null): number | undefined {
    if (!cursusId) return undefined;
    const c: any = this.cursusList.find(x => String(x.id) === String(cursusId));
    return c?.parcoursId ?? c?.parcours?.id ?? undefined;
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'soumise': return 'blue';
      case 'etude': return 'orange';
      case 'approuvee': return 'green';
      case 'rejetee': return 'red';
      default: return 'gray';
    }
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'soumise': return 'Soumise';
      case 'etude': return 'En étude';
      case 'approuvee': return 'Approuvée';
      case 'rejetee': return 'Rejetée';
      default: return statut;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
}
