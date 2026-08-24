import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-fiche-demande-page',
  templateUrl: './fiche-demande-page.component.html',
  styleUrls: ['./fiche-demande-page.component.scss']
})
export class FicheDemandePageComponent extends BaseComponentClass implements OnInit {
  demande: DemandeDocument | null = null;
  loading: boolean = true;
  id: string | null = null;

  workflowSteps = [
    { key: 'soumise', label: 'Demande soumise', icon: 'receipt_long' },
    { key: 'en_attente_paiement', label: 'En attente de paiement', icon: 'payments' },
    { key: 'paye', label: 'Payé', icon: 'check_circle' },
    { key: 'en_preparation', label: 'En préparation', icon: 'edit' },
    { key: 'document_pret', label: 'Document prêt', icon: 'picture_as_pdf' },
    { key: 'remise', label: 'Remis', icon: 'verified' }
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private demandeService: DemandeDocumentService
  ) {
    super();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.loadDemande();
    }
  }

  loadDemande(): void {
    this.loading = true;
    this.demandeService.get(this.id!).subscribe({
      next: (data) => {
        this.demande = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/scolarite/secretariat/demandes']);
      }
    });
  }

  getCurrentStepIndex(): number {
    if (!this.demande) return 0;
    const idx = this.workflowSteps.findIndex(s => s.key === this.demande!.statut);
    return idx >= 0 ? idx : 0;
  }

  isStepCompleted(stepKey: string): boolean {
    if (!this.demande) return false;
    const order = ['soumise','en_attente_paiement','paye','en_preparation','document_pret','remise'];
    const currentIdx = order.indexOf(this.demande.statut);
    const stepIdx = order.indexOf(stepKey);
    return stepIdx <= currentIdx;
  }

  isStepCurrent(stepKey: string): boolean {
    return this.demande?.statut === stepKey;
  }

  formatDate(date: any): string {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getMontantLettres(): string {
    if (!this.demande?.montant) return 'zéro';
    const n = Number(this.demande.montant);
    if (n === 0) return 'zéro';
    const UNITES = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf'];
    const DIX = ['','dix','vingt','trente','quarante','cinquante','soixante','soixante-dix','quatre-vingt','quatre-vingt-dix'];
    function conv(x: number): string {
      if (x === 0) return 'zéro';
      if (x < 0) return 'moins ' + conv(-x);
      if (x >= 1000000) return conv(Math.floor(x/1000000)) + ' million ' + conv(x % 1000000);
      if (x >= 1000) return conv(Math.floor(x/1000)) + ' mille ' + conv(x % 1000);
      if (x >= 100) return conv(Math.floor(x/100)) + ' cent ' + conv(x % 100);
      if (x >= 80) return 'quatre-vingt' + (x > 80 ? ' ' + conv(x-80) : 's');
      if (x >= 70) return 'soixante-dix' + (x > 70 ? ' ' + conv(x-70) : '');
      if (x >= 60) return 'soixante' + (x > 60 ? ' ' + conv(x-60) : '');
      if (x >= 50) return 'cinquante' + (x > 50 ? ' ' + conv(x-50) : '');
      if (x >= 40) return 'quarante' + (x > 40 ? ' ' + conv(x-40) : '');
      if (x >= 30) return 'trente' + (x > 30 ? ' ' + conv(x-30) : '');
      if (x >= 20) return 'vingt' + (x > 20 ? ' ' + conv(x-20) : '');
      if (x >= 10) return DIX[x-10] || '';
      return UNITES[x];
    }
    return conv(n);
  }
}
