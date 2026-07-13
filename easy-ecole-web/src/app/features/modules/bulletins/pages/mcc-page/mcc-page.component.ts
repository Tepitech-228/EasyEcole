import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { MccService } from '../../services/mcc.service';

@Component({
  selector: 'app-mcc-page',
  templateUrl: './mcc-page.component.html',
  styleUrls: ['./mcc-page.component.scss']
})
export class MccPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(
    private service: MccService,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.service.delete(id).subscribe(() => {
      this.items = this.items.filter(i => i.id !== id);
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
