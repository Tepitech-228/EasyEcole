import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { environment } from 'src/environments/environment';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {

  /** Arborescence rendue par app-dossier-view (année → niveau → parcours) */
  nodes: DossierNode[] = [];
  /** Colonnes du tableau de détail, construites dynamiquement selon le rôle */
  columns: DossierColumn[] = [];

  /** États de chargement et pagination (passés à app-dossier-view) */
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  pageSize = 20;

  showNouvelleDemandeModal = false;
  alreadySignUp = false;
  demandeError = false;
  sessions: Session[] = [];
  currentSession = 0;
  errorMessage = '';

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  /** Actions affichées sur chaque ligne de demande dans app-dossier-view */
  itemActions: BatchAction[] = [
    { label: 'Traiter', action: 'traiter', color: 'blue', icon: 'edit' },
    { label: 'Détails', action: 'details', color: 'gray', icon: 'visibility' },
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private demandeInscriptionService: DemandeInscriptionService,
    private sessionService: SessionService
  ) {
    super()
    this.buildColumns()
    this.loadTree()
    this.getSessions()
  }

  ngOnInit(): void {}

  /**
   * Construit dynamiquement le tableau des colonnes à partir de rolesValue.
   * La colonne « Apprenant » n'est visible que pour institution et admin.
   * Peut être reconstruite si les rôles changent asynchronement.
   */
  private buildColumns(): void {
    const showApprenant = this.rolesValue.isInstitution || this.rolesValue.isAdmin;
    const cols: DossierColumn[] = [{ key: 'index', label: '#' }];
    if (showApprenant) {
      cols.push({ key: 'apprenant', label: 'Apprenant' });
    }
    cols.push(
      { key: 'dateDemande', label: 'Date' },
      { key: 'statut', label: 'Statut' },
    );
    this.columns = cols;
  }

  /**
   * Transforme la hiérarchie brute (année → niveau → parcours) en DossierNode[]
   * en mémorisant l'identifiant de l'année pour chaque nœud dans data.anneeId.
   */
  private buildTree(data: any[], anneeId?: number): DossierNode[] {
    return data.map(node => {
      const currentAnneeId = node.type === 'annee' ? node.data.id : anneeId;
      return {
        type: node.type,
        id: node.id,
        label: node.label,
        data: { ...node.data, anneeId: currentAnneeId },
        expanded: false,
        children: node.children ? this.buildTree(node.children, currentAnneeId) : [],
      };
    });
  }

  /** Charge l'arborescence depuis l'endpoint /hierarchy et la transforme en DossierNode[]. */
  private loadTree(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.API_MODULES.INSCRIPTION}/hierarchy`).subscribe({
      next: (data) => {
        this.nodes = this.buildTree(data);
        this.loading = false;
      },
      error: () => { this.loading = false }
    });
  }

  /**
   * Appelé par app-dossier-view via (toggleNode) quand un nœud est expanded.
   * Charge les demandes pour un nœud parcours et les attache comme items.
   */
  onToggleNode(node: DossierNode): void {
    if (node.expanded && !node.items?.length) {
      this.loadDetail(node);
    }
  }

  /** Charge les demandes d'un nœud sélectionné et les injecte comme items du nœud. */
  private loadDetail(node: DossierNode): void {
    const nodeId = node.data?.id || 0;
    const anneeId = node.data?.anneeId || 0;
    this.http.get<any>(`${environment.API_MODULES.INSCRIPTION}/hierarchy/${node.type}/${nodeId}/${anneeId}`).subscribe({
      next: (res) => {
        const demandes = (res.demandes || []).map((d: any, i: number) => ({
          ...d,
          index: i + 1,
          date: d.dateDemande,
          statut: d.dateValidation ? 'validee' : 'en_attente',
          apprenant: d.utilisateur?.nom + ' ' + d.utilisateur?.prenoms,
        }));
        node.items = demandes;
        // Recréer le tableau de nodes pour forcer la détection de changement Angular
        this.nodes = [...this.nodes];
        this.totalItems = demandes.length;
      },
      error: () => {}
    });
  }

  /** Gestion de l'action par ligne : ouvre la demande via openDemande. */
  onItemAction(event: { item: any, action: string }): void {
    this.openDemande(event.item.id);
  }

  /** Filtre optionnel pour afficher « Traiter » ou « Détails » selon l'état de la demande. */
  canShowItemAction = (item: any, action: string): boolean => {
    if (action === 'traiter') return item.reponseInscription === undefined;
    if (action === 'details') return item.reponseInscription !== undefined;
    return true;
  }

  private getSessions(): void {
    this.sessionService.getAll().subscribe({
      next: (res) => {
        this.sessions = res
          .filter(session => Session.getEtat(session.dateDebut, session.dateFin) != EtatsSession.CLOTUREE)
          .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateFin).getTime())
      },
      error: () => {}
    })
  }

  faireDemandeInscription(): void {
    if (this.sessions.length === 0) return

    const demandeInscription = new DemandeInscription()
    demandeInscription.dateDemande = new Date()
    demandeInscription.sessionId = this.sessions[this.currentSession].id

    this.demandeInscriptionService.create(demandeInscription).subscribe({
      next: (value) => {
        this.router.navigate(['/inscription/demandes/' + value.id])
      },
      error: (err: HttpErrorResponse) => {
        this.showNouvelleDemandeModal = false
        if (err.error?.alreadySignUp == true) {
          this.alreadySignUp = true
          setTimeout(() => { this.alreadySignUp = false }, 3000)
        } else {
          this.demandeError = true
          setTimeout(() => { this.demandeError = false }, 3000)
        }
      }
    })
  }

  openDemande(id: number): void {
    this.router.navigate(['/inscription/demandes/', id])
  }
}
