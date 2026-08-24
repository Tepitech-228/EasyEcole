import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { EtatsSession } from 'src/app/data/enums/EtatsSession';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { ParcoursChoisi } from 'src/app/data/modules/inscription/models/ParcoursChoisi.model';
import { Session } from 'src/app/data/modules/inscription/models/Session.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { SessionService } from 'src/app/data/modules/inscription/services/session.service';
import { environment } from 'src/environments/environment';

interface TreeNode {
  id: string;
  type: 'annee' | 'niveau' | 'parcours';
  label: string;
  data: { id: number; dossiers: number; demandes: number; bordereaux: number };
  children?: TreeNode[];
  expanded?: boolean;
  loading?: boolean;
}

@Component({
  selector: 'app-liste-demandes-page',
  templateUrl: './liste-demandes-page.component.html',
  styleUrls: ['./liste-demandes-page.component.scss']
})
export class ListeDemandesPageComponent extends BaseComponentClass implements OnInit {

  tree: TreeNode[] = [];
  treeLoading = false;
  selectedNode: TreeNode | null = null;
  detailLoading = false;
  detailDemandes: any[] = [];

  showNouvelleDemandeModal = false;
  alreadySignUp = false;
  demandeError = false;
  sessions: Session[] = [];
  currentSession = 0;
  errorMessage = '';

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(
    private router: Router,
    private http: HttpClient,
    private demandeInscriptionService: DemandeInscriptionService,
    private sessionService: SessionService
  ) {
    super()
    this.loadTree()
    this.getSessions()
  }

  ngOnInit(): void {}

  private loadTree(): void {
    this.treeLoading = true
    this.http.get<any[]>(`${environment.API_MODULES.INSCRIPTION}/hierarchy`).subscribe({
      next: (data) => {
        this.tree = data.map(node => ({ ...node, expanded: false, loading: false }))
        this.treeLoading = false
      },
      error: () => { this.treeLoading = false }
    })
  }

  toggle(node: TreeNode): void {
    if (node.children?.length) {
      node.expanded = !node.expanded
    }
  }

  select(node: TreeNode): void {
    this.selectedNode = node
    this.detailLoading = true
    this.detailDemandes = []
    this.http.get<any>(`${environment.API_MODULES.INSCRIPTION}/hierarchy/${node.type}/${node.data.id}/${this.getAnneeId(node)}`).subscribe({
      next: (res) => {
        this.detailDemandes = res.demandes || []
        this.detailLoading = false
      },
      error: () => { this.detailLoading = false }
    })
  }

  private getAnneeId(node: TreeNode): number {
    let current: TreeNode | undefined = node
    while (current && current.type !== 'annee') {
      current = this.findParent(current)
    }
    return current?.data.id || 0
  }

  private findParent(node: TreeNode): TreeNode | undefined {
    for (const parent of this.tree) {
      if (parent.children?.some(c => c.id === node.id)) return parent
      if (parent.children) {
        for (const child of parent.children) {
          if (child.children?.some(c => c.id === node.id)) return child
        }
      }
    }
    return undefined
  }

  get counts(): { demandes: number } {
    return { demandes: this.selectedNode?.data.demandes ?? 0 }
  }

  private getSessions(): void {
    this.sessionService.getAll().subscribe({
      next: (res) => {
        // Sessions non clôturées : en cours ou à venir.
        this.sessions = res
          .filter(session => Session.getEtat(session.dateDebut, session.dateFin) != EtatsSession.CLOTUREE)
          .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
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
