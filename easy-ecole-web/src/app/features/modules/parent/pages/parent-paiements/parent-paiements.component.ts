import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ParentService, Enfant, PaiementData } from '../../services/parent.service';

@Component({
  selector: 'app-parent-paiements',
  templateUrl: './parent-paiements.component.html',
  styleUrls: ['./parent-paiements.component.scss']
})
export class ParentPaiementsComponent implements OnInit {
  enfants: Enfant[] = [];
  selectedEnfant: Enfant | null = null;
  paiements: PaiementData[] = [];
  loading = false;

  constructor(
    private parentService: ParentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.parentService.getEnfants().subscribe({
      next: (enfants) => {
        this.enfants = enfants;
        const apprenantId = Number(this.route.snapshot.params['apprenantId']);
        this.selectedEnfant = enfants.find(e => e.apprenantId === apprenantId) || enfants[0] || null;
        if (this.selectedEnfant) this.loadPaiements();
      }
    });
  }

  onEnfantChange(): void {
    this.loadPaiements();
  }

  private loadPaiements(): void {
    if (!this.selectedEnfant) return;
    this.loading = true;
    this.parentService.getPaiements(this.selectedEnfant.apprenantId).subscribe({
      next: (paiements) => {
        this.paiements = paiements;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = { paye: 'Payé', impaye: 'Impayé', partiel: 'Partiel' };
    return map[statut] || statut;
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      paye: 'bg-green-50 text-green-600',
      impaye: 'bg-red-50 text-red-600',
      partiel: 'bg-orange-50 text-orange-600'
    };
    return map[statut] || 'bg-gray-50 text-gray-600';
  }

  get soldeTotal(): number {
    return this.paiements.reduce((sum, p) => sum + p.montant, 0);
  }

  get totalPaye(): number {
    return this.paiements.reduce((sum, p) => sum + p.montantPaye, 0);
  }

  get soldeRestant(): number {
    return this.soldeTotal - this.totalPaye;
  }
}
