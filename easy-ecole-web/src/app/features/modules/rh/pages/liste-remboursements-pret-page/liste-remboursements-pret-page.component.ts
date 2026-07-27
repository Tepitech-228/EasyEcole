import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhRemboursementPretService } from 'src/app/data/modules/rh/services/rh-remboursement-pret.service';
import { RhPretService } from 'src/app/data/modules/rh/services/rh-pret.service';
import { RemboursementPret } from 'src/app/data/modules/rh/models/RemboursementPret.model';
import { PretEmploye } from 'src/app/data/modules/rh/models/PretEmploye.model';

@Component({
  selector: 'app-liste-remboursements-pret-page',
  templateUrl: './liste-remboursements-pret-page.component.html',
  styleUrls: ['./liste-remboursements-pret-page.component.scss']
})
export class ListeRemboursementsPretPageComponent extends BaseComponentClass implements OnInit {
  remboursements: RemboursementPret[] = [];
  prets: PretEmploye[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { pretId: '', montant: '', datePaiement: '', methodePaiement: '' };
  pretIdFilter: string = '';
  selectedPret: PretEmploye | null = null;

  constructor(
    private remboursementService: RhRemboursementPretService,
    private pretService: RhPretService,
    private route: ActivatedRoute,
  ) { super(); }

  ngOnInit(): void {
    this.pretIdFilter = this.route.snapshot.params['pretId'] || '';
    if (this.pretIdFilter) {
      this.pretService.get(this.pretIdFilter).subscribe({
        next: (data) => { this.selectedPret = data; this.formData.pretId = data.id; }
      });
    }
    this.pretService.getAll().subscribe(data => this.prets = data);
    this.getRemboursements();
  }

  getRemboursements(): void {
    this.loading = true;
    this.remboursementService.getAll().subscribe({
      next: (res) => { this.remboursements = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get filteredRemboursements(): RemboursementPret[] {
    if (!this.pretIdFilter) return this.remboursements;
    return this.remboursements.filter(r => r.pretId === this.pretIdFilter);
  }

  getPretMontant(id?: string): string {
    if (!id) return '-';
    const pret = this.prets.find(p => p.id === id);
    return pret?.montant != null ? pret.montant + ' F' : '-';
  }

  ouvrirFormulaire() {
    this.formData = { pretId: this.pretIdFilter || '', montant: '', datePaiement: '', methodePaiement: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerRemboursement() {
    if (!this.formData.pretId || !this.formData.montant) return;
    const item = new RemboursementPret();
    item.pretId = this.formData.pretId;
    item.montant = Number(this.formData.montant);
    item.datePaiement = this.formData.datePaiement;
    item.methodePaiement = this.formData.methodePaiement;
    this.remboursementService.create(item).subscribe({
      next: () => { this.fermerFormulaire(); this.getRemboursements(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer ce remboursement ?')) return;
    this.remboursementService.delete(id).subscribe({ next: () => this.getRemboursements() });
  }

  trackByFn(index: number, item: RemboursementPret): any { return item.id; }
}
