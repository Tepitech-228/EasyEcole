import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhPretService } from 'src/app/data/modules/rh/services/rh-pret.service';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { PretEmploye } from 'src/app/data/modules/rh/models/PretEmploye.model';

@Component({
  selector: 'app-liste-prets-page',
  templateUrl: './liste-prets-page.component.html',
  styleUrls: ['./liste-prets-page.component.scss']
})
export class ListePretsPageComponent extends BaseComponentClass implements OnInit {
  prets: PretEmploye[] = [];
  employes: any[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { employeId: '', montant: '', nombreMois: '', motif: '' };

  constructor(
    private pretService: RhPretService,
    private employeService: RhEmployeService,
  ) { super(); }

  ngOnInit(): void {
    this.employeService.getAll().subscribe(data => this.employes = data);
    this.getPrets();
  }

  getPrets(): void {
    this.loading = true;
    this.pretService.getAll().subscribe({
      next: (res) => { this.prets = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get mensualiteCalculee(): number {
    const montant = Number(this.formData.montant) || 0;
    const mois = Number(this.formData.nombreMois) || 1;
    return montant / mois;
  }

  getEmployeNom(id?: string): string {
    if (!id) return '-';
    const emp = this.employes.find(e => e.id === id);
    return emp ? `${emp.nom || ''} ${emp.prenoms || ''}`.trim() || '-' : '-';
  }

  getStatutClass(statut?: string): string {
    const map: Record<string, string> = {
      'En cours': 'bg-blue-100 text-blue-700',
      'Remboursé': 'bg-green-100 text-green-700',
      'En attente': 'bg-yellow-100 text-yellow-700',
      'Refusé': 'bg-red-100 text-red-700',
    };
    return map[statut || ''] || 'bg-gray-100 text-gray-600';
  }

  ouvrirFormulaire() {
    this.formData = { employeId: '', montant: '', nombreMois: '', motif: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerPret() {
    if (!this.formData.employeId || !this.formData.montant || !this.formData.nombreMois) return;
    const item = new PretEmploye();
    item.employeId = this.formData.employeId;
    item.montant = Number(this.formData.montant);
    item.nombreMois = Number(this.formData.nombreMois);
    item.mensualite = this.mensualiteCalculee;
    item.motif = this.formData.motif;
    item.statut = 'En attente';
    this.pretService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getPrets(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer ce prêt ?')) return;
    this.pretService.delete(id).subscribe({ next: () => this.getPrets() });
  }

  trackByFn(index: number, item: PretEmploye): any { return item.id; }
}
