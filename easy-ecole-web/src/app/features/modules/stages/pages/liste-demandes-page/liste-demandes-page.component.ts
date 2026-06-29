import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeStageService } from 'src/app/data/modules/stages/services/demande-stage.service';
import { DemandeStage } from 'src/app/data/modules/stages/models/DemandeStage.model';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {
  demandes: DemandeStage[] = [];
  loading: boolean = false;
  filtreStatut: string = '';

  constructor(private demandeStageService: DemandeStageService) { super(); }

  ngOnInit(): void {
    this.getDemandes();
  }

  getDemandes(): void {
    this.loading = true;
    this.demandeStageService.getAll().subscribe({
      next: (res) => { this.demandes = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get demandesFiltrees(): DemandeStage[] {
    if (!this.filtreStatut) return this.demandes;
    return this.demandes.filter(d => d.statut === this.filtreStatut);
  }

  get nbEnAttente(): number { return this.demandes.filter(d => d.statut === 'en_attente').length }
  get nbValidees(): number { return this.demandes.filter(d => d.statut === 'valide').length }
  get nbRejetees(): number { return this.demandes.filter(d => d.statut === 'rejete').length }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'valide': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'rejete': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'en_attente': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'valide': return 'Validée';
      case 'rejete': return 'Rejetée';
      case 'en_attente': return 'En attente';
      default: return statut || '-';
    }
  }

  valider(id?: string) {
    if (!id) return;
    this.demandeStageService.valider(id).subscribe({ next: () => this.getDemandes() });
  }

  rejeter(id?: string) {
    if (!id) return;
    const motif = prompt('Motif du rejet :');
    this.demandeStageService.rejeter(id, motif || undefined).subscribe({ next: () => this.getDemandes() });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette demande ?')) return;
    this.demandeStageService.delete(id).subscribe({ next: () => this.getDemandes() });
  }

  resetFiltres() { this.filtreStatut = ''; }

  trackByFn(index: number, item: DemandeStage): any { return item.id; }
}
