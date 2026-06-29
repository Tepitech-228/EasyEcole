import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DeliberationService } from '../../services/deliberation.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';

@Component({
  selector: 'app-deliberations-page',
  templateUrl: './deliberations-page.component.html',
  styleUrls: ['./deliberations-page.component.scss']
})
export class DeliberationsPageComponent extends BaseComponentClass implements OnInit {
  deliberations: any[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { libelle: '', classeId: '', anneeAcademiqueId: '', periode: 'semestre1', date: '' };
  filtres: any = { classeId: '', anneeAcademiqueId: '', periode: '', statut: '' };
  pagination: any = { page: 1, limit: 50, total: 0, totalPages: 0 };

  classes: Classe[] = [];
  anneesAcademiques: AnneeAcademique[] = [];

  constructor(
    private deliberationService: DeliberationService,
    private classeService: ClasseService,
    private anneeAcademiqueService: AnneeAcademiqueService,
  ) { super(); }

  ngOnInit(): void {
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.anneeAcademiqueService.getAll().subscribe(data => this.anneesAcademiques = data);
    this.charger();
  }

  charger() {
    this.loading = true;
    const params: any = { page: this.pagination.page, limit: this.pagination.limit };
    if (this.filtres.classeId) params.classeId = this.filtres.classeId;
    if (this.filtres.anneeAcademiqueId) params.anneeAcademiqueId = this.filtres.anneeAcademiqueId;
    if (this.filtres.periode) params.periode = this.filtres.periode;
    if (this.filtres.statut) params.statut = this.filtres.statut;

    this.deliberationService.getAll(params).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.deliberations = res.data;
          this.pagination = res.pagination || this.pagination;
        } else {
          this.deliberations = Array.isArray(res) ? res : [];
        }
      },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  resetFiltres() {
    this.filtres = { classeId: '', anneeAcademiqueId: '', periode: '', statut: '' };
    this.pagination.page = 1;
    this.charger();
  }

  get nbPlanifiees(): number { return this.deliberations.filter(d => d.statut === 'planifiee').length }
  get nbEnCours(): number { return this.deliberations.filter(d => d.statut === 'en_cours').length }
  get nbCloturees(): number { return this.deliberations.filter(d => d.statut === 'cloturee').length }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'cloturee': return 'bg-green-50 text-green-700 ring-1 ring-green-200';
      case 'en_cours': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
      case 'planifiee': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
      default: return 'bg-gray-50 text-gray-400 ring-1 ring-gray-200';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'cloturee': return 'Clôturée';
      case 'en_cours': return 'En cours';
      case 'planifiee': return 'Planifiée';
      default: return statut;
    }
  }

  ouvrirFormulaire() {
    this.formData = { libelle: '', classeId: '', anneeAcademiqueId: '', periode: 'semestre1', date: '' };
    this.showForm = true;
  }

  fermerFormulaire() {
    this.showForm = false;
  }

  creerDeliberation() {
    if (!this.formData.libelle || !this.formData.classeId || !this.formData.anneeAcademiqueId || !this.formData.date) return;

    this.deliberationService.create(this.formData).subscribe({
      next: () => {
        this.fermerFormulaire();
        this.charger();
      },
      error: (err) => console.error('Erreur création:', err)
    });
  }

  supprimer(id: number) {
    if (!confirm('Supprimer cette délibération ?')) return;
    this.deliberationService.delete(id).subscribe({
      next: () => this.charger()
    });
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
