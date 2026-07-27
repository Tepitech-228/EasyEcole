import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhPrestataireService } from 'src/app/data/modules/rh/services/rh-prestataire.service';
import { Prestataire } from 'src/app/data/modules/rh/models/Prestataire.model';

@Component({
  selector: 'app-liste-prestataires-page',
  templateUrl: './liste-prestataires-page.component.html',
  styleUrls: ['./liste-prestataires-page.component.scss']
})
export class ListePrestatairesPageComponent extends BaseComponentClass implements OnInit {
  prestataires: Prestataire[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { nom: '', prenom: '', type: '', email: '', telephone: '', adresse: '', specialite: '', modeReglement: '', tauxJournalier: '', numeroCompte: '', statut: 'Actif', dateDebut: '', dateFin: '', notes: '' };
  filterType: string = '';

  constructor(
    private prestataireService: RhPrestataireService,
  ) { super(); }

  ngOnInit(): void {
    this.getPrestataires();
  }

  get filteredPrestataires(): Prestataire[] {
    if (!this.filterType) return this.prestataires;
    return this.prestataires.filter(p => p.type === this.filterType);
  }

  getPrestataires(): void {
    this.loading = true;
    this.prestataireService.getAll().subscribe({
      next: (res) => { this.prestataires = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  getStatutClass(statut?: string): string {
    return statut === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  }

  ouvrirFormulaire() {
    this.formData = { nom: '', prenom: '', type: '', email: '', telephone: '', adresse: '', specialite: '', modeReglement: '', tauxJournalier: '', numeroCompte: '', statut: 'Actif', dateDebut: '', dateFin: '', notes: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerPrestataire() {
    if (!this.formData.nom || !this.formData.prenom || !this.formData.type) return;
    const item = new Prestataire();
    item.nom = this.formData.nom;
    item.prenom = this.formData.prenom;
    item.type = this.formData.type;
    item.email = this.formData.email;
    item.telephone = this.formData.telephone;
    item.adresse = this.formData.adresse;
    item.specialite = this.formData.specialite;
    item.modeReglement = this.formData.modeReglement;
    item.tauxJournalier = Number(this.formData.tauxJournalier) || 0;
    item.numeroCompte = this.formData.numeroCompte;
    item.statut = this.formData.statut;
    item.dateDebut = this.formData.dateDebut;
    item.dateFin = this.formData.dateFin;
    item.notes = this.formData.notes;
    this.prestataireService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getPrestataires(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer ce prestataire ?')) return;
    this.prestataireService.delete(id).subscribe({ next: () => this.getPrestataires() });
  }

  trackByFn(index: number, item: Prestataire): any { return item.id; }
}
