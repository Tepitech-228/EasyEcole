import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DispenseService } from '../../services/dispense.service';

@Component({
  selector: 'app-dispenses-page',
  templateUrl: './dispenses-page.component.html',
  styleUrls: ['./dispenses-page.component.scss']
})
export class DispensesPageComponent extends BaseComponentClass implements OnInit {
  dispenses: any[] = [];
  loading = false;

  constructor(private router: Router, private service: DispenseService) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.dispenses = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.service.delete(id).subscribe(() => {
      this.dispenses = this.dispenses.filter(d => d.id !== id);
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
