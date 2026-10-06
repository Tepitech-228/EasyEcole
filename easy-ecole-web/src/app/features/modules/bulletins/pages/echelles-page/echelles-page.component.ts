import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EchelleNoteService } from '../../services/echelle-note.service';

@Component({
  selector: 'app-echelles-page',
  templateUrl: './echelles-page.component.html',
  styleUrls: ['./echelles-page.component.scss']
})
export class EchellesPageComponent extends BaseComponentClass implements OnInit {
  echelles: any[] = [];
  loading = false;
  errorMessage = '';
  savingId: number | null = null;
  deletingId: number | null = null;

  constructor(private router: Router, private service: EchelleNoteService) { super(); }

  ngOnInit(): void {
    this.chargerEchelles();
  }

  chargerEchelles(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll().subscribe({
      next: (res) => { this.echelles = res; this.loading = false; },
      error: () => {
        this.errorMessage = 'Les échelles de notes n’ont pas pu être chargées. Réessayez.';
        this.loading = false;
      }
    });
  }

  basculerStatut(id: number): void {
    const echelle = this.echelles.find(e => e.id === id);
    if (!echelle) return;
    const previousStatus = echelle.estActive;
    this.savingId = id;
    this.errorMessage = '';
    this.service.update(id, { ...echelle, estActive: !echelle.estActive }).subscribe({
      next: () => {
        echelle.estActive = !previousStatus;
        this.savingId = null;
      },
      error: () => {
        this.errorMessage = 'Le statut de l’échelle n’a pas pu être modifié.';
        this.savingId = null;
      }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.deletingId = id;
    this.errorMessage = '';
    this.service.delete(id).subscribe({
      next: () => {
        this.echelles = this.echelles.filter(e => e.id !== id);
        this.deletingId = null;
      },
      error: () => {
        this.errorMessage = 'La suppression a échoué. L’échelle est toujours présente.';
        this.deletingId = null;
      }
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
