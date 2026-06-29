import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeStageService } from 'src/app/data/modules/stages/services/demande-stage.service';
import { DemandeStage } from 'src/app/data/modules/stages/models/DemandeStage.model';

@Component({
  selector: 'app-details-demande-page',
  templateUrl: './details-demande-page.component.html',
  styleUrls: ['./details-demande-page.component.scss']
})
export class DetailsDemandePageComponent extends BaseComponentClass implements OnInit {
  demande?: DemandeStage;
  error: boolean = false;
  loading: boolean = false;

  constructor(
    private demandeStageService: DemandeStageService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get("id");
    if (id) this.getDemande(id);
  }

  getDemande(id: string): void {
    this.loading = true;
    this.demandeStageService.get(id).subscribe({
      next: (res) => { this.demande = res; },
      error: (err: HttpErrorResponse) => {
        this.error = true;
        if (err.status == 404) this.router.navigate(['/stages/demandes']);
      },
      complete: () => this.loading = false
    });
  }

  valider() {
    if (!this.demande?.id) return;
    this.demandeStageService.valider(this.demande.id).subscribe({
      next: () => this.getDemande(this.demande!.id!)
    });
  }

  rejeter() {
    if (!this.demande?.id) return;
    const motif = prompt('Motif du rejet :');
    this.demandeStageService.rejeter(this.demande.id, motif || undefined).subscribe({
      next: () => this.getDemande(this.demande!.id!)
    });
  }

  delete() {
    if (!this.demande?.id) return;
    if (!confirm('Supprimer cette demande ?')) return;
    this.demandeStageService.delete(this.demande.id).subscribe({
      next: () => this.router.navigate(['/stages/demandes']),
      error: (err) => console.log(err)
    });
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'valide': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'rejete': return 'bg-red-50 text-red-700 ring-1 ring-red-200';
      case 'en_attente': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'valide': return 'Validée';
      case 'rejete': return 'Rejetée';
      case 'en_attente': return 'En attente';
      default: return statut || '-';
    }
  }

  retour(): void {
    this.router.navigate(['/stages/demandes']);
  }
}
