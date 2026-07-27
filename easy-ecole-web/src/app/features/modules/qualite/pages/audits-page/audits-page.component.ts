import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { QualiteAuditService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';

@Component({
  selector: 'app-audits-page',
  templateUrl: './audits-page.component.html',
  styleUrls: ['./audits-page.component.scss']
})
export class AuditsPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};

  constructor(private service: QualiteAuditService) { super(); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  ouvrirFormulaire(item?: any): void {
    this.editingId = item?.id || null;
    this.formData = item ? { ...item } : { type: 'interne', titre: '', processus: '', datePlanifiee: '', equipe: '', referentiel: 'ISO 21001', statut: 'planifie' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; }

  sauvegarder(): void {
    if (!this.formData.titre || !this.formData.datePlanifiee) return;
    const obs = this.editingId ? this.service.update(this.editingId, this.formData) : this.service.create(this.formData);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id?: string): void {
    if (!id || !confirm('Supprimer cet audit ?')) return;
    this.service.delete(id).subscribe({ next: () => this.load() });
  }

  getStatutColor(statut?: string): string {
    const map: any = { planifie: 'bg-gray-100 text-gray-600', en_cours: 'bg-blue-100 text-blue-700', termine: 'bg-green-100 text-green-700', cloture: 'bg-purple-100 text-purple-700' };
    return map[statut || ''] || 'bg-gray-100 text-gray-600';
  }
}
