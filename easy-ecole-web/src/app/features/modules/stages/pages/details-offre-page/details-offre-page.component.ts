import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { OffreStageService } from 'src/app/data/modules/stages/services/offre-stage.service';
import { OffreStage } from 'src/app/data/modules/stages/models/OffreStage.model';

@Component({
  selector: 'app-details-offre-page',
  templateUrl: './details-offre-page.component.html',
  styleUrls: ['./details-offre-page.component.scss']
})
export class DetailsOffrePageComponent extends BaseComponentClass implements OnInit {
  offre?: OffreStage;
  error: boolean = false;
  loading: boolean = false;

  constructor(
    private offreStageService: OffreStageService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get("id");
    if (id) this.getOffre(id);
  }

  getOffre(id: string): void {
    this.loading = true;
    this.offreStageService.get(id).subscribe({
      next: (res) => { this.offre = res; },
      error: (err: HttpErrorResponse) => {
        this.error = true;
        if (err.status == 404) this.router.navigate(['/stages/offres']);
      },
      complete: () => this.loading = false
    });
  }

  delete(): void {
    if (!this.offre?.id) return;
    if (!confirm('Supprimer cette offre de stage ?')) return;
    this.offreStageService.delete(this.offre.id).subscribe({
      next: () => this.router.navigate(['/stages/offres']),
      error: (err) => console.log(err)
    });
  }

  toggleStatut(): void {
    if (!this.offre?.id) return;
    this.offreStageService.toggleStatut(this.offre.id).subscribe({
      next: () => this.getOffre(this.offre!.id!)
    });
  }

  getStatutClass(statut?: string): string {
    return statut === 'ouvert' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200';
  }

  getStatutLabel(statut?: string): string {
    return statut === 'ouvert' ? 'Ouvert' : 'Fermé';
  }

  retour(): void {
    this.router.navigate(['/stages/offres']);
  }
}
