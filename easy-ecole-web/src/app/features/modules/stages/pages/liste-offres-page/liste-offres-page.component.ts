import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { OffreStageService } from 'src/app/data/modules/stages/services/offre-stage.service';
import { OffreStage } from 'src/app/data/modules/stages/models/OffreStage.model';

@Component({
  selector: 'app-liste-offres-page',
  templateUrl: './liste-offres-page.component.html',
  styleUrls: ['./liste-offres-page.component.scss']
})
export class ListeOffresPageComponent extends BaseComponentClass implements OnInit {
  offres: OffreStage[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { titre: '', description: '', dateDebut: '', dateFin: '', lieu: '', nombrePlaces: 1 };
  filtreStatut: string = '';

  constructor(private offreStageService: OffreStageService) { super(); }

  ngOnInit(): void {
    this.getOffres();
  }

  getOffres(): void {
    this.loading = true;
    this.offreStageService.getAll().subscribe({
      next: (res) => { this.offres = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get offresFiltrees(): OffreStage[] {
    if (!this.filtreStatut) return this.offres;
    return this.offres.filter(o => o.statut === this.filtreStatut);
  }

  get nbOuvertes(): number { return this.offres.filter(o => o.statut === 'ouvert').length }
  get nbFermees(): number { return this.offres.filter(o => o.statut === 'ferme').length }

  ouvrirFormulaire() {
    this.formData = { titre: '', description: '', dateDebut: '', dateFin: '', lieu: '', nombrePlaces: 1 };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerOffre() {
    if (!this.formData.titre || !this.formData.dateDebut || !this.formData.dateFin) return;
    const offre = new OffreStage();
    offre.titre = this.formData.titre;
    offre.description = this.formData.description;
    offre.dateDebut = this.formData.dateDebut;
    offre.dateFin = this.formData.dateFin;
    offre.lieu = this.formData.lieu;
    offre.nombrePlaces = this.formData.nombrePlaces;
    this.offreStageService.create(offre).subscribe({
      next: () => { this.fermerFormulaire(); this.getOffres(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer cette offre de stage ?')) return;
    this.offreStageService.delete(id).subscribe({ next: () => this.getOffres() });
  }

  toggleStatut(offre: OffreStage) {
    this.offreStageService.toggleStatut(offre.id!).subscribe({ next: () => this.getOffres() });
  }

  getStatutClass(statut?: string): string {
    return statut === 'ouvert' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200';
  }

  getStatutLabel(statut?: string): string {
    return statut === 'ouvert' ? 'Ouvert' : 'Fermé';
  }

  resetFiltres() { this.filtreStatut = ''; }

  trackByFn(index: number, item: OffreStage): any { return item.id; }
}
