import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SessionExamenService } from '../../services/session-examen.service';

@Component({
  selector: 'app-sessions-examen-page',
  templateUrl: './sessions-examen-page.component.html',
  styleUrls: ['./sessions-examen-page.component.scss']
})
export class SessionsExamenPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  errorMessage = '';
  deletingId: number | null = null;

  constructor(
    private service: SessionExamenService,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    this.chargerSessions();
  }

  chargerSessions(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll().subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => {
        this.errorMessage = 'Les sessions n’ont pas pu être chargées. Réessayez.';
        this.loading = false;
      }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.deletingId = id;
    this.errorMessage = '';
    this.service.delete(id).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.id !== id);
        this.deletingId = null;
      },
      error: () => {
        this.errorMessage = 'La suppression a échoué. La session est toujours présente.';
        this.deletingId = null;
      }
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
