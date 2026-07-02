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

  constructor(private router: Router, private service: EchelleNoteService) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.echelles = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  basculerStatut(id: number): void {
    const echelle = this.echelles.find(e => e.id === id);
    if (!echelle) return;
    this.service.update(id, { ...echelle, estActive: !echelle.estActive }).subscribe({
      next: () => { echelle.estActive = !echelle.estActive; }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.service.delete(id).subscribe(() => {
      this.echelles = this.echelles.filter(e => e.id !== id);
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
