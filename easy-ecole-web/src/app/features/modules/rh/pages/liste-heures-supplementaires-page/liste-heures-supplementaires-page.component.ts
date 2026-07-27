import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhHeureSupplementaireService } from 'src/app/data/modules/rh/services/rh-heure-supplementaire.service';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { HeureSupplementaire } from 'src/app/data/modules/rh/models/HeureSupplementaire.model';

@Component({
  selector: 'app-liste-heures-supplementaires-page',
  templateUrl: './liste-heures-supplementaires-page.component.html',
  styleUrls: ['./liste-heures-supplementaires-page.component.scss']
})
export class ListeHeuresSupplementairesPageComponent extends BaseComponentClass implements OnInit {
  heures: HeureSupplementaire[] = [];
  employes: any[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { employeId: '', date: '', nombreHeures: '', tauxHoraire: '', montant: 0, motif: '' };

  constructor(
    private heureService: RhHeureSupplementaireService,
    private employeService: RhEmployeService,
  ) { super(); }

  ngOnInit(): void {
    this.employeService.getAll().subscribe(data => this.employes = data);
    this.getHeures();
  }

  getHeures(): void {
    this.loading = true;
    this.heureService.getAll().subscribe({
      next: (res) => { this.heures = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get montantCalcule(): number {
    const heures = Number(this.formData.nombreHeures) || 0;
    const taux = Number(this.formData.tauxHoraire) || 0;
    return heures * taux;
  }

  getEmployeNom(id?: string): string {
    if (!id) return '-';
    const emp = this.employes.find(e => e.id === id);
    return emp ? `${emp.nom || ''} ${emp.prenoms || ''}`.trim() || '-' : '-';
  }

  getStatutClass(statut?: string): string {
    const map: Record<string, string> = {
      'En attente': 'bg-yellow-100 text-yellow-700',
      'Approuvé': 'bg-green-100 text-green-700',
      'Refusé': 'bg-red-100 text-red-700',
      'Payé': 'bg-blue-100 text-blue-700',
    };
    return map[statut || ''] || 'bg-gray-100 text-gray-600';
  }

  ouvrirFormulaire() {
    this.formData = { employeId: '', date: '', nombreHeures: '', tauxHoraire: '', montant: 0, motif: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerHeure() {
    if (!this.formData.employeId || !this.formData.nombreHeures || !this.formData.tauxHoraire) return;
    const item = new HeureSupplementaire();
    item.employeId = this.formData.employeId;
    item.date = this.formData.date;
    item.nombreHeures = Number(this.formData.nombreHeures);
    item.tauxHoraire = Number(this.formData.tauxHoraire);
    item.montant = this.montantCalcule;
    item.motif = this.formData.motif;
    item.statut = 'En attente';
    this.heureService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getHeures(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette heure supplémentaire ?')) return;
    this.heureService.delete(id).subscribe({ next: () => this.getHeures() });
  }

  trackByFn(index: number, item: HeureSupplementaire): any { return item.id; }
}
