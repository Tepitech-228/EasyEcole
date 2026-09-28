import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ListeNoteEvaluationService } from 'src/app/data/modules/inscription/services/liste-note-evaluation.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-pv-notes-page',
  templateUrl: './pv-notes-page.component.html',
  styleUrls: ['./pv-notes-page.component.scss']
})
export class PvNotesPageComponent extends BaseComponentClass implements OnInit {
  // Listes
  listeNotes: any[] = [];
  parcours: any[] = [];
  niveaux: any[] = [];

  // Filtres
  selectedParcoursId = '';
  selectedNiveauId = '';
  selectedType = 'tous'; // 'tous' | 'vides' | 'saisis'

  // États
  loading = true;
  exporting = false;

  constructor(
    private listeNoteService: ListeNoteEvaluationService,
    private parcoursService: ParcoursService,
    private niveauService: NiveauEtudeService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadFiltres();
  }

  private loadData(): void {
    this.loading = true;
    this.listeNoteService.getAll().subscribe({
      next: (res: any) => {
        this.listeNotes = Array.isArray(res) ? res : (res?.data || []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des PV');
      }
    });
  }

  private loadFiltres(): void {
    this.parcoursService.getAll().subscribe(data => this.parcours = data);
    this.niveauService.getAll().subscribe(data => this.niveaux = data);
  }

  get listeFiltres(): any[] {
    let result = this.listeNotes;

    if (this.selectedParcoursId) {
      result = result.filter(l => String(l.cours?.parcoursId) === String(this.selectedParcoursId));
    }
    if (this.selectedNiveauId) {
      result = result.filter(l => String(l.cours?.niveauEtudeId) === String(this.selectedNiveauId));
    }
    if (this.selectedType === 'vides') {
      result = result.filter(l => !l.notes || l.notes.length === 0);
    } else if (this.selectedType === 'saisis') {
      result = result.filter(l => l.notes && l.notes.length > 0);
    }

    return result;
  }

  get pvVides(): any[] {
    return this.listeFiltres.filter(l => !l.notes || l.notes.length === 0);
  }

  get pvSaisis(): any[] {
    return this.listeFiltres.filter(l => l.notes && l.notes.length > 0);
  }

  onFilterChange(): void {
    // Les getters se mettent à jour automatiquement
  }

  onExportPv(liste: any): void {
    if (!liste?.id) return;
    this.exporting = true;
    this.listeNoteService.exportPv(liste.id, 'pdf').subscribe({
      next: (res: any) => {
        this.exporting = false;
        if (res?.filename) {
          window.open(res.filename, '_blank');
        } else if (res?.url) {
          window.open(res.url, '_blank');
        }
        this.toastService.success('PV exporté avec succès');
      },
      error: () => {
        this.exporting = false;
        this.toastService.error('Erreur lors de l\'export du PV');
      }
    });
  }

  onExportExcel(liste: any): void {
    if (!liste?.id) return;
    this.exporting = true;
    this.listeNoteService.exportPv(liste.id, 'excel').subscribe({
      next: (res: any) => {
        this.exporting = false;
        if (res?.filename) {
          window.open(res.filename, '_blank');
        } else if (res?.url) {
          window.open(res.url, '_blank');
        }
        this.toastService.success('PV exporté avec succès');
      },
      error: () => {
        this.exporting = false;
        this.toastService.error('Erreur lors de l\'export du PV');
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  }
}
