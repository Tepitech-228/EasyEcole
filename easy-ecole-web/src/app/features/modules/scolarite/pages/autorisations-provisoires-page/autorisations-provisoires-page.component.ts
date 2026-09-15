import { Component, OnInit } from '@angular/core';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { DossierNode } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-autorisations-provisoires-page',
  templateUrl: './autorisations-provisoires-page.component.html',
  styleUrls: ['./autorisations-provisoires-page.component.scss']
})
export class AutorisationsProvisoiresPageComponent implements OnInit {
  documents: DemandeDocument[] = [];
  nodes: DossierNode[] = [];
  loading = false;
  errorMessage = '';
  totalItems = 0;
  annees: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  sessions: Session[] = [];
  dataLoaded = false;
  selectedFilters = { anneeId: '', niveauId: '', parcoursId: '' };

  readonly itemActions = [
    { label: 'Télécharger', color: 'blue', action: 'telecharger', icon: 'download' },
    { label: 'Imprimer', color: 'gray', action: 'imprimer', icon: 'print' }
  ];

  readonly columns = [
    { key: 'etudiantLabel', label: 'Étudiant' },
    { key: 'matricule', label: 'Matricule' },
    { key: 'numeroDemande', label: 'Référence' },
    { key: 'dateGeneration', label: 'Générée le' }
  ];

  constructor(
    private demandeService: DemandeDocumentService,
    private anneeService: AnneeAcademiqueService,
    private niveauService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.anneeService.getAll(),
      this.niveauService.getAll(),
      this.parcoursService.getAll(),
      this.sessionService.getAll(),
    ]).subscribe({
      next: ([annees, niveaux, parcours, sessions]) => {
        this.annees = annees || [];
        this.niveaux = niveaux || [];
        this.parcoursList = parcours || [];
        this.sessions = sessions || [];
        this.dataLoaded = true;
      },
      error: () => { this.dataLoaded = true; }
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.demandeService.getAutorisationsProvisoires().subscribe({
      next: (response) => {
        this.documents = response.data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les autorisations provisoires.';
        this.loading = false;
      }
    });
  }

  onFilterChange(filters: { anneeId: string; niveauId: string; parcoursId: string }): void {
    this.selectedFilters = filters;
    this.applyFilters();
  }

  private applyFilters(): void {
    const filtered = this.documents.filter(document => {
      const matchesYear = !this.selectedFilters.anneeId || String(document.anneeAcademiqueId) === this.selectedFilters.anneeId;
      const matchesParcours = !this.selectedFilters.parcoursId || String(document.parcoursId) === this.selectedFilters.parcoursId;
      const matchesNiveau = !this.selectedFilters.niveauId || String(document.niveauEtudeId) === this.selectedFilters.niveauId;
      return matchesYear && matchesNiveau && matchesParcours;
    });
    this.totalItems = filtered.length;
    this.nodes = this.buildTree(filtered);
  }

  private buildTree(documents: DemandeDocument[]): DossierNode[] {
    const years = new Map<string, Map<string, DemandeDocument[]>>();
    documents.forEach(document => {
      const year = String((document as any).anneeLibelle || document.anneeAcademiqueId || 'Année non renseignée');
      const parcours = String(document.parcoursId || 'Filière non renseignée');
      if (!years.has(year)) years.set(year, new Map());
      if (!years.get(year)!.has(parcours)) years.get(year)!.set(parcours, []);
      years.get(year)!.get(parcours)!.push(document);
    });

    return Array.from(years.entries()).map(([year, parcoursMap]) => ({
      type: 'annee', label: year, id: year, expanded: true,
      children: Array.from(parcoursMap.entries()).map(([parcours, documentsDuParcours]) => ({
        type: 'parcours', label: documentsDuParcours[0] && (documentsDuParcours[0] as any).parcoursLibelle
          ? (documentsDuParcours[0] as any).parcoursLibelle
          : `Parcours / filière #${parcours}`, id: parcours, expanded: true,
        children: [{
          type: 'etudiant', label: 'Étudiants inscrits', id: `${year}-${parcours}`, expanded: true,
          items: documentsDuParcours.map(document => ({
            ...document,
            etudiantLabel: `${(document as any).etudiant?.nom || ''} ${(document as any).etudiant?.prenoms || ''}`.trim() || `Étudiant #${document.etudiantId}`,
            matricule: (document as any).matricule || '—'
          }))
        }]
      }))
    }));
  }

  canShowAction(item: any, action: string): boolean {
    return ['telecharger', 'imprimer'].includes(action) && !!item?.fichierPDF;
  }

  onItemAction(event: { item: DemandeDocument; action: string }): void {
    if (!event.item.id) return;
    this.demandeService.downloadAutorisationProvisoire(event.item.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        if (event.action === 'imprimer') {
          const printWindow = window.open(url, '_blank');
          printWindow?.addEventListener('load', () => printWindow.print());
          return;
        }
        const link = document.createElement('a');
        link.href = url;
        link.download = `autorisation-provisoire-${event.item.numeroDemande || event.item.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.errorMessage = 'Le PDF de cette autorisation est indisponible.'
    });
  }
}
