import { Component, OnInit } from '@angular/core';
import { RecuCaisseService } from 'src/app/data/modules/scolarite/services/recu-caisse.service';

@Component({
  selector: 'app-caisse-page',
  templateUrl: './caisse-page.component.html',
  styleUrls: ['./caisse-page.component.scss']
})
export class CaissePageComponent implements OnInit {
  errorMessage: string = '';
  successMessage: string = '';

  recus: any[] = [];
  loadingRecus: boolean = false;

  constructor(
    private recuService: RecuCaisseService
  ) {}

  ngOnInit() {
    this.loadRecus();
  }

  get demandesPayees(): any[] {
    return this.recus;
  }

  get montantTotalEncaisse(): number {
    return this.recus.reduce((total, recu) => total + (Number(recu.montant) || 0), 0);
  }

  loadRecus() {
    this.loadingRecus = true;
    this.recuService.getAll({ page: 1, limit: 8 }).subscribe({
      next: (res: any) => {
        this.recus = res.data || [];
        this.loadingRecus = false;
      },
      error: () => { this.loadingRecus = false; }
    });
  }

  printRecu(id: string): void {
    this.recuService.print(id).subscribe({
      next: (html) => {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.print();
        }
      },
      error: () => {
        this.errorMessage = 'Impossible d\'imprimer le reçu pour le moment.';
      }
    });
  }

  formatModePaiement(mode: string): string {
    switch (mode) {
      case 'especes': return 'Espèces';
      case 'mobile_money': return 'Mobile Money';
      case 'autre': return 'Autre';
      default: return mode;
    }
  }
}