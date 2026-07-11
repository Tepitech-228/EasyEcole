import { Component, OnInit } from '@angular/core';
import { DemandeVAE } from 'src/app/data/modules/scolarite/models/DemandeVAE.model';
import { DemandeVAEService } from 'src/app/data/modules/scolarite/services/demande-vae.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-demandes-vae-page',
  templateUrl: './demandes-vae-page.component.html',
  styleUrls: ['./demandes-vae-page.component.scss']
})
export class DemandesVAEPageComponent extends BaseComponentClass implements OnInit {
  items: DemandeVAE[] = [];
  _items: DemandeVAE[] = [];
  loading: boolean = false;
  adding: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  searchQuery: string = '';

  newItem: any = {
    utilisateurId: '', type: 'vae', parcoursCibleId: '', justificatifs: null
  };

  currentPage: number = 1;
  pageSize: number = 15;

  constructor(private service: DemandeVAEService) {
    super();
  }

  ngOnInit(): void {
    this.loadItems();
  }

  get paginatedItems(): DemandeVAE[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._items.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this._items.length / this.pageSize) || 1;
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
    if (!this.newItem.utilisateurId || !this.newItem.type) return;
    this.adding = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.service.create(this.newItem).subscribe({
      next: () => {
        this.newItem = { utilisateurId: '', type: 'vae', parcoursCibleId: '', justificatifs: null };
        this.successMessage = 'Demande VAE soumise avec succès';
        this.adding = false;
        this.loadItems();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la soumission';
        this.adding = false;
      }
    });
  }

  traiter(s: DemandeVAE, statut: string): void {
    if (!s.id) return;
    this.service.traiter(s.id, statut).subscribe({
      next: () => {
        this.successMessage = 'Demande traitée avec succès';
        this.loadItems();
      },
      error: () => this.errorMessage = 'Erreur lors du traitement'
    });
  }

  filtrer(): void {
    this.currentPage = 1;
    this._items = this.items.filter(s => {
      return !this.searchQuery || s.type.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'soumise': return 'blue';
      case 'instruction': return 'orange';
      case 'acceptee': return 'green';
      case 'rejetee': return 'red';
      default: return 'gray';
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
}
