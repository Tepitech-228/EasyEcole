import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EquivalenceService } from '../../services/equivalence.service';

@Component({
  selector: 'app-equivalences-page',
  templateUrl: './equivalences-page.component.html',
  styleUrls: ['./equivalences-page.component.scss']
})
export class EquivalencesPageComponent extends BaseComponentClass implements OnInit {
  equivalences: any[] = [];
  loading = false;

  constructor(private router: Router, private service: EquivalenceService) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.equivalences = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.service.delete(id).subscribe(() => {
      this.equivalences = this.equivalences.filter(e => e.id !== id);
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
