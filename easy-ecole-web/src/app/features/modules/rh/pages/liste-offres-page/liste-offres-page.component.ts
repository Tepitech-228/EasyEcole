import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhOffreEmploiService } from 'src/app/data/modules/rh/services/rh-offre-emploi.service';
import { RhPosteService } from 'src/app/data/modules/rh/services/rh-poste.service';
import { RhOffreEmploi } from 'src/app/data/modules/rh/models/RhOffreEmploi.model';
import { RhPoste } from 'src/app/data/modules/rh/models/RhPoste.model';

@Component({
  selector: 'app-liste-offres-page',
  templateUrl: './liste-offres-page.component.html',
  styleUrls: ['./liste-offres-page.component.scss']
})
export class ListeOffresPageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = false;
  offres: RhOffreEmploi[] = [];
  postes: RhPoste[] = [];
  showForm: boolean = false;
  isEditing: boolean = false;
  formData: any = { posteId: '', description: '', dateCloture: '', statut: 'publiée' };
  errorMessage: string = '';

  constructor(
    private offreService: RhOffreEmploiService,
    private posteService: RhPosteService,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    this.loadOffres();
    this.posteService.getAll().subscribe(data => this.postes = data);
  }

  loadOffres(): void {
    this.loading = true;
    this.errorMessage = '';
    this.offreService.getAll().subscribe({
      next: (res) => { this.offres = res; },
      error: (err) => { console.error(err); this.errorMessage = 'Impossible de charger les offres.'; this.loading = false; },
      complete: () => this.loading = false
    });
  }

  getPosteTitre(offre: RhOffreEmploi): string {
    if (offre.poste && offre.poste.titre) return offre.poste.titre;
    const poste = this.postes.find(p => p.id === offre.posteId);
    return poste ? poste.titre || '-' : '-';
  }

  ouvrirCreation(): void {
    this.isEditing = false;
    this.showForm = true;
    this.formData = { posteId: '', description: '', dateCloture: '', statut: 'publiée' };
  }

  ouvrirEdition(offre: RhOffreEmploi): void {
    this.isEditing = true;
    this.showForm = true;
    this.formData = {
      id: offre.id,
      posteId: offre.posteId,
      description: offre.description,
      dateCloture: offre.dateCloture ? String(offre.dateCloture).substring(0, 10) : '',
      statut: offre.statut || 'publiée'
    };
  }

  fermerFormulaire(): void {
    this.showForm = false;
    this.errorMessage = '';
  }

  soumettre(): void {
    if (!this.formData.posteId) { this.errorMessage = 'Veuillez sélectionner un poste.'; return; }

    if (this.isEditing) {
      const item = new RhOffreEmploi();
      item.id = this.formData.id;
      item.posteId = this.formData.posteId;
      item.description = this.formData.description || undefined;
      item.dateCloture = this.formData.dateCloture ? new Date(this.formData.dateCloture) : undefined;
      item.statut = this.formData.statut || 'publiée';
      this.offreService.update(item).subscribe({
        next: () => { this.fermerFormulaire(); this.loadOffres(); },
        error: (err) => { console.error(err); this.errorMessage = 'Erreur lors de la mise à jour.'; }
      });
    } else {
      const item = new RhOffreEmploi();
      item.posteId = this.formData.posteId;
      item.description = this.formData.description || undefined;
      item.dateCloture = this.formData.dateCloture ? new Date(this.formData.dateCloture) : undefined;
      item.statut = 'publiée';
      this.offreService.create(item).subscribe({
        next: () => { this.fermerFormulaire(); this.loadOffres(); },
        error: (err) => { console.error(err); this.errorMessage = 'Erreur lors de la création.'; }
      });
    }
  }

  supprimer(id?: string): void {
    if (!id) return;
    if (!confirm('Supprimer cette offre d\'emploi ?')) return;
    this.offreService.delete(id).subscribe({
      next: () => this.loadOffres(),
      error: (err) => { console.error(err); this.errorMessage = 'Erreur lors de la suppression.'; }
    });
  }

  voirDetail(id?: string): void {
    if (!id) return;
    this.router.navigate(['/rh/offres-emploi', id]);
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'publiée': 'bg-green-100 text-green-700', 'fermée': 'bg-red-100 text-red-700' };
    return map[statut] || 'bg-gray-100 text-gray-700';
  }

  trackByFn(index: number, item: RhOffreEmploi): any { return item.id; }
}