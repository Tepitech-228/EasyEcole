import { Component, OnInit } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Router } from '@angular/router';
import { DossierNode, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-liste-bulletins-page',
  templateUrl: './liste-bulletins-page.component.html',
  styleUrls: ['./liste-bulletins-page.component.scss']
})
export class ListeBulletinsPageComponent extends BaseComponentClass implements OnInit {
  // Filter data
  annees: AnneeAcademique[] = [];
  niveaux: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  sessions: Session[] = [];
  dataLoaded: boolean = false;

  // Filter values
  selectedAnneeId: string = '';
  selectedNiveauId: string = '';
  selectedParcoursId: string = '';
  semestre: string = '';
  statut: string = '';

  // Data
  loading: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 50;
  totalItems: number = 0;
  totalPages: number = 1;

  // Dossier tree
  treeNodes: DossierNode[] = [];

  itemColumns = [
    { key: 'moyenneGenerale', label: 'Moy.' },
    { key: 'mention', label: 'Mention' },
    { key: 'totalCredits', label: 'Crédits' },
    { key: 'rang', label: 'Rang' },
    { key: 'statut', label: 'Statut' }
  ];

  batchActions: BatchAction[] = [
    { label: 'Consulter', color: 'blue', action: 'consulter', icon: 'visibility' }
  ];

  constructor(
    private bulletinService: BulletinService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
    private sessionService: SessionService,
    private router: Router,
  ) {
    super();
  }

  ngOnInit() {
    if (this.rolesValue.isApprenant) {
      this.router.navigate(['/bulletins/mon-releve']);
      return;
    }

    combineLatest([
      this.anneeAcademiqueService.getAll(),
      this.niveauEtudeService.getAll(),
      this.parcoursService.getAll(),
      this.sessionService.getAll()
    ]).subscribe({
      next: ([annees, niveaux, parcours, sessions]) => {
        this.annees = annees;
        this.niveaux = niveaux;
        this.parcoursList = parcours;
        this.sessions = sessions;
        this.dataLoaded = true;
      },
      error: () => {
        this.dataLoaded = true;
      }
    });

    this.charger();
  }

  onFilterChange(filters: { anneeId: string; niveauId: string; parcoursId: string }): void {
    this.selectedAnneeId = filters.anneeId;
    this.selectedNiveauId = filters.niveauId;
    this.selectedParcoursId = filters.parcoursId;
    this.currentPage = 1;
    this.charger();
  }

  charger() {
    this.loading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.selectedAnneeId) params.anneeAcademiqueId = this.selectedAnneeId;
    if (this.selectedNiveauId) params.niveauEtudeId = this.selectedNiveauId;
    if (this.selectedParcoursId) params.parcoursId = this.selectedParcoursId;
    if (this.semestre) params.semestre = this.semestre;
    if (this.statut) params.statut = this.statut;

    this.bulletinService.getAll(params).subscribe({
      next: (res: any) => {
        const bulletins = res?.data || [];
        this.totalItems = res?.pagination?.total || bulletins.length;
        this.totalPages = res?.pagination?.totalPages || 1;
        this.currentPage = res?.pagination?.page || 1;
        this.buildTreeNodes(bulletins);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private buildTreeNodes(bulletins: any[]): void {
    const groups: any = {};

    for (const b of bulletins) {
      const anneeKey = b.anneeAcademiqueId || 'sans-annee';
      const niveauKey = b.niveauEtudeId || 'sans-niveau';
      const classeKey = b.classeId || 'sans-classe';
      const etudiantKey = b.utilisateurId;
      const etudiantLabel = b.utilisateur
        ? `${b.utilisateur.nom || ''} ${b.utilisateur.prenoms || ''}`.trim() || `#${b.utilisateurId}`
        : `#${b.utilisateurId}`;

      if (!groups[anneeKey]) groups[anneeKey] = { niveaux: {} };
      if (!groups[anneeKey].niveaux[niveauKey]) groups[anneeKey].niveaux[niveauKey] = { classes: {} };
      if (!groups[anneeKey].niveaux[niveauKey].classes[classeKey]) {
        groups[anneeKey].niveaux[niveauKey].classes[classeKey] = {
          label: b.classe?.libelle || `Classe #${classeKey}`,
          etudiants: {}
        };
      }
      if (!groups[anneeKey].niveaux[niveauKey].classes[classeKey].etudiants[etudiantKey]) {
        groups[anneeKey].niveaux[niveauKey].classes[classeKey].etudiants[etudiantKey] = {
          label: etudiantLabel,
          items: []
        };
      }
      groups[anneeKey].niveaux[niveauKey].classes[classeKey].etudiants[etudiantKey].items.push(b);
    }

    this.treeNodes = Object.entries(groups).map(([anneeKey, anneeData]: [string, any]) => ({
      type: 'annee' as const,
      label: this.getAnneeLibelle(anneeKey),
      expanded: true,
      children: Object.entries(anneeData.niveaux).map(([niveauKey, niveauData]: [string, any]) => ({
        type: 'niveau' as const,
        label: this.getNiveauLibelle(niveauKey),
        expanded: true,
        children: Object.entries(niveauData.classes).map(([classeKey, classeData]: [string, any]) => ({
          type: 'parcours' as const,
          label: classeData.label,
          expanded: true,
          children: Object.entries(classeData.etudiants).map(([etudiantKey, etudiant]: [string, any]) => ({
            type: 'etudiant' as const,
            label: etudiant.label,
            id: etudiantKey,
            expanded: true,
            items: etudiant.items.map((item: any) => ({
              ...item,
              rang: item.rang ? `${item.rang}/${item.effectifClasse}` : '-',
              totalCredits: item.creditsValides != null && item.totalCredits != null ? `${item.creditsValides}/${item.totalCredits}` : '-'
            }))
          }))
        }))
      }))
    }));
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.charger();
  }

  onItemAction(event: { item: any; action: string }): void {
    if (event.action === 'consulter') {
      this.router.navigate(['/bulletins', event.item.id]);
    }
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }

  private getAnneeLibelle(id: string): string {
    if (id === 'sans-annee') return 'Sans année';
    return this.annees.find(a => String(a.id) === String(id))?.libelle || `Année #${id}`;
  }

  private getNiveauLibelle(id: string): string {
    if (id === 'sans-niveau') return 'Sans niveau';
    return this.niveaux.find(n => String(n.id) === String(id))?.libelle || `Niveau #${id}`;
  }
}
