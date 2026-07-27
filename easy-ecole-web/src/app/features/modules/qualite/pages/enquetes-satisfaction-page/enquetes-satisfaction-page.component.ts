import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { QualiteEnqueteSatisfactionService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';

@Component({
  selector: 'app-enquetes-satisfaction-page',
  templateUrl: './enquetes-satisfaction-page.component.html',
  styleUrls: ['./enquetes-satisfaction-page.component.scss']
})
export class EnquetesSatisfactionPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  formData: any = {};
  stats: any = null;

  constructor(private service: QualiteEnqueteSatisfactionService) { super(); }

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
    this.formData = item ? { ...item, questions: item.questions ? JSON.stringify(item.questions, null, 2) : '' } : { titre: '', cible: 'tous', dateDebut: '', dateFin: '', questions: '[]', statut: 'brouillon' };
    this.showForm = true;
  }

  fermerFormulaire(): void { this.showForm = false; this.editingId = null; this.stats = null; }

  sauvegarder(): void {
    if (!this.formData.titre || !this.formData.dateDebut || !this.formData.dateFin) return;
    const data = { ...this.formData };
    try { data.questions = JSON.parse(data.questions); } catch { data.questions = []; }
    const obs = this.editingId ? this.service.update(this.editingId, data) : this.service.create(data);
    obs.subscribe({ next: () => { this.fermerFormulaire(); this.load(); } });
  }

  supprimer(id?: string): void {
    if (!id || !confirm('Supprimer cette enquête ?')) return;
    this.service.delete(id).subscribe({ next: () => this.load() });
  }

  voirStats(id?: string): void {
    if (!id) return;
    this.service.getStatistiques(id).subscribe({
      next: (res) => this.stats = res,
      error: () => alert('Erreur chargement stats')
    });
  }
}
