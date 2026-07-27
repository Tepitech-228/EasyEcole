import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhIndemnitePrestataireService } from 'src/app/data/modules/rh/services/rh-indemnite-prestataire.service';
import { RhPrestataireService } from 'src/app/data/modules/rh/services/rh-prestataire.service';
import { IndemnitePrestataire } from 'src/app/data/modules/rh/models/IndemnitePrestataire.model';
import { Prestataire } from 'src/app/data/modules/rh/models/Prestataire.model';

@Component({
  selector: 'app-indemnites-prestataire-page',
  templateUrl: './indemnites-prestataire-page.component.html',
  styleUrls: ['./indemnites-prestataire-page.component.scss']
})
export class IndemnitesPrestatairePageComponent extends BaseComponentClass implements OnInit {
  indemnites: IndemnitePrestataire[] = [];
  prestataires: Prestataire[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { prestataireId: '', typeIndemnite: '', libelle: '', montant: '', devise: 'FCFA', dateDebut: '', dateFin: '', nombreJours: 1, description: '', statut: 'En attente', datePaiement: '', modePaiement: '', validePar: '' };
  prestataireIdFilter: string = '';
  selectedPrestataire: Prestataire | null = null;

  constructor(
    private indemniteService: RhIndemnitePrestataireService,
    private prestataireService: RhPrestataireService,
    private route: ActivatedRoute,
  ) { super(); }

  ngOnInit(): void {
    this.prestataireIdFilter = this.route.snapshot.params['prestataireId'] || '';
    if (this.prestataireIdFilter) {
      this.prestataireService.get(this.prestataireIdFilter).subscribe({
        next: (data) => { this.selectedPrestataire = data; this.formData.prestataireId = data.id; }
      });
    }
    this.prestataireService.getAll().subscribe(data => this.prestataires = data);
    this.getIndemnites();
  }

  get filteredIndemnites(): IndemnitePrestataire[] {
    if (!this.prestataireIdFilter) return this.indemnites;
    return this.indemnites.filter(i => i.prestataireId === this.prestataireIdFilter);
  }

  getIndemnites(): void {
    this.loading = true;
    this.indemniteService.getAll().subscribe({
      next: (res) => { this.indemnites = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  getPrestataireNom(id?: string): string {
    if (!id) return '-';
    const p = this.prestataires.find(x => x.id === id);
    return p ? `${p.nom || ''} ${p.prenom || ''}`.trim() || '-' : '-';
  }

  get montantCalcule(): number {
    if (this.formData.typeIndemnite === 'journalier') {
      const prestataire = this.prestataires.find(p => p.id === this.formData.prestataireId);
      const taux = Number(prestataire?.tauxJournalier) || 0;
      const jours = Number(this.formData.nombreJours) || 1;
      return taux * jours;
    }
    return Number(this.formData.montant) || 0;
  }

  onTypeIndemniteChange() {
    if (this.formData.typeIndemnite === 'journalier') {
      this.formData.montant = this.montantCalcule;
    }
  }

  getStatutClass(statut?: string): string {
    const map: Record<string, string> = {
      'En attente': 'bg-yellow-100 text-yellow-700',
      'Payé': 'bg-green-100 text-green-700',
      'Annulé': 'bg-red-100 text-red-700',
    };
    return map[statut || ''] || 'bg-gray-100 text-gray-600';
  }

  ouvrirFormulaire() {
    this.formData = { prestataireId: this.prestataireIdFilter || '', typeIndemnite: '', libelle: '', montant: '', devise: 'FCFA', dateDebut: '', dateFin: '', nombreJours: 1, description: '', statut: 'En attente', datePaiement: '', modePaiement: '', validePar: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerIndemnite() {
    if (!this.formData.prestataireId || !this.formData.typeIndemnite || !this.formData.libelle) return;
    const item = new IndemnitePrestataire();
    item.prestataireId = this.formData.prestataireId;
    item.typeIndemnite = this.formData.typeIndemnite;
    item.libelle = this.formData.libelle;
    item.montant = this.montantCalcule;
    item.devise = this.formData.devise;
    item.dateDebut = this.formData.dateDebut;
    item.dateFin = this.formData.dateFin;
    item.nombreJours = Number(this.formData.nombreJours) || 1;
    item.description = this.formData.description;
    item.statut = this.formData.statut;
    item.datePaiement = this.formData.datePaiement;
    item.modePaiement = this.formData.modePaiement;
    item.validePar = this.formData.validePar;
    this.indemniteService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getIndemnites(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette indemnité ?')) return;
    this.indemniteService.delete(id).subscribe({ next: () => this.getIndemnites() });
  }

  trackByFn(index: number, item: IndemnitePrestataire): any { return item.id; }
}
