import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { JuryMembreService } from '../../services/jury-membre.service';

@Component({
  selector: 'app-jury-membres-page',
  templateUrl: './jury-membres-page.component.html',
  styleUrls: ['./jury-membres-page.component.scss']
})
export class JuryMembresPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private service: JuryMembreService, private router: Router) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'president': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
      case 'secretaire': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      case 'assesseur': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-200';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'president': return 'Président';
      case 'secretaire': return 'Secrétaire';
      case 'assesseur': return 'Assesseur';
      default: return 'Membre';
    }
  }

  supprimer(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.service.delete(id).subscribe(() => {
      this.items = this.items.filter(i => i.id !== id);
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
