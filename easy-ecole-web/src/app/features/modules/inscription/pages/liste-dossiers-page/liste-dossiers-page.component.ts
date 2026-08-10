import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import {
  DossierArbreAnnee,
  DossierArbreClasse,
  DossierArbreDossier,
  DossierArbreFiliere,
  DossierArbreNiveau,
  DossierEtudiantService,
} from 'src/app/data/modules/inscription/services/dossier-etudiant.service';
import { environment } from 'src/environments/environment';
import { DossierNode, DossierColumn, BatchAction } from 'src/app/shared/components/dossier-view/dossier-view.component';

@Component({
  selector: 'app-liste-dossiers-page',
  templateUrl: './liste-dossiers-page.component.html',
  styleUrls: ['./liste-dossiers-page.component.scss']
})
export class ListeDossiersPageComponent extends BaseComponentClass implements OnInit {

  arbre: DossierArbreAnnee[] = []
  nodes: DossierNode[] = []
  totalAffiches: number = 0

  error: boolean = false
  loading: boolean = false

  searchTerm: string = ''
  selectedStatut: string = ''

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly DOSSIERS_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.DOSSIERS
  readonly BORDEREAUX_PATH: string = environment.MEDIAS_PATH.INSCRIPTION.BORDEREAUX

  readonly columns: DossierColumn[] = [
    { key: 'matricule', label: 'Matricule', width: '120px' },
    { key: 'nom', label: 'Nom & Prénoms' },
    { key: 'statut', label: 'Statut', width: '100px' },
    { key: 'dateCreation', label: 'Date création', width: '120px' },
  ]

  readonly batchActions: BatchAction[] = [
    { label: 'Valider', color: 'green', action: 'valider', icon: 'check_circle' },
    { label: 'Suspendre', color: 'yellow', action: 'suspendre', icon: 'pause_circle' },
    { label: 'Archiver', color: 'red', action: 'archiver', icon: 'archive' },
  ]

  readonly itemActions: BatchAction[] = [
    { label: 'Visualiser', color: 'indigo', action: 'visualiser', icon: 'visibility' },
  ]

  private readonly statutMap: Record<string, 'actif' | 'suspendu' | 'archive'> = {
    valider: 'actif',
    suspendre: 'suspendu',
    archiver: 'archive',
  }

  showDetailModal = false
  detailData: any = null
  detailLoading = false

  constructor(
    private http: HttpClient,
    private dossierEtudiantService: DossierEtudiantService,
  ) {
    super()
  }

  ngOnInit(): void {
    this.getArbre()
  }

  getArbre(): void {
    this.loading = true
    this.error = false

    this.dossierEtudiantService.getArbre().subscribe({
      next: (res) => {
        this.arbre = Array.isArray(res) ? res : []
        this.rebuildTree()
        this.loading = false
      },
      error: (err) => {
        console.log(err)
        this.error = true
        this.loading = false
      }
    })
  }

  onSearch(): void {
    this.rebuildTree()
  }

  onStatutChange(): void {
    this.rebuildTree()
  }

  // ========================================================================
  //  Construction de l'arborescence (Année → Filière → Niveau → Classe → Salles → Étudiants)
  // ========================================================================

  private rebuildTree(): void {
    this.nodes = this.arbre
      .map(a => this.buildAnneeNode(a))
      .filter((n): n is DossierNode => !!n)
    this.totalAffiches = this.countItems(this.nodes)
  }
  private buildAnneeNode(annee: DossierArbreAnnee): DossierNode | null {
    const children = annee.filieres
      .map(f => this.buildFiliereNode(f))
      .filter((n): n is DossierNode => !!n)
    if (children.length === 0) return null

    return {
      type: 'annee',
      id: annee.anneeId ? String(annee.anneeId) : annee.annee,
      label: annee.annee,
      expanded: true,
      children,
      subtitle: `${this.countClasses(children)} classe(s) · ${this.countItems(children)} étudiant(s)`,
    }
  }

  private buildFiliereNode(filiere: DossierArbreFiliere): DossierNode | null {
    const children = filiere.niveaux
      .map(n => this.buildNiveauNode(n))
      .filter((n): n is DossierNode => !!n)
    if (children.length === 0) return null

    return {
      type: 'parcours',
      id: filiere.parcoursId ? String(filiere.parcoursId) : filiere.filiere,
      label: filiere.filiere,
      expanded: false,
      children,
      subtitle: `${this.countItems(children)} étudiant(s)`,
    }
  }

  private buildNiveauNode(niveau: DossierArbreNiveau): DossierNode | null {
    const children = niveau.classes
      .map(c => this.buildClasseNode(c))
      .filter((n): n is DossierNode => !!n)
    if (children.length === 0) return null

    return {
      type: 'niveau',
      id: niveau.niveauId ? String(niveau.niveauId) : niveau.niveau,
      label: niveau.niveau,
      expanded: false,
      children,
      subtitle: `${this.countItems(children)} étudiant(s)`,
    }
  }

  private buildClasseNode(classe: DossierArbreClasse): DossierNode | null {
    const items = (classe.dossiers ?? [])
      .filter(d => this.dossierMatchesFilter(d))
      .map(d => this.dossierToItem(d))
    if (items.length === 0) return null

    const salles = classe.salles ?? []
    if (salles.length > 0) {
      // Une salle par nœud enfant, les dossiers de la classe en items.
      return {
        type: 'classe',
        id: classe.classeId ? String(classe.classeId) : classe.classe,
        label: classe.classe,
        expanded: false,
        children: salles.map(salle => ({
          type: 'salle' as const,
          label: salle,
          expanded: false,
          items,
        })),
      }
    }

    // Sans salle rattachée : les dossiers sont directement les items de la classe.
    return {
      type: 'classe',
      id: classe.classeId ? String(classe.classeId) : classe.classe,
      label: classe.classe,
      expanded: false,
      items,
    }
  }

  private dossierMatchesFilter(d: DossierArbreDossier): boolean {
    if (this.selectedStatut && d.statut !== this.selectedStatut) return false

    const query = this.searchTerm.trim().toLowerCase()
    if (!query) return true

    const haystack = [d.matricule, d.nom, d.prenoms].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query)
  }

  private dossierToItem(d: DossierArbreDossier): any {
    const nomComplet = [d.nom, d.prenoms].filter(Boolean).join(' ').trim()
    return {
      id: d.id,
      matricule: d.matricule ?? '-',
      nom: nomComplet || '-',
      prenoms: d.prenoms ?? '',
      statut: d.statut ?? 'inactif',
      dateCreation: this.formatDate(d.dateCreation),
      photo: this.getPhotoUrl(d),
    }
  }

  private formatDate(value: string | Date | undefined): string {
    if (!value) return '-'
    const date = new Date(value)
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR')
  }

  private getPhotoUrl(d: DossierArbreDossier): string {
    if (d.photo) {
      if (/^https?:\/\//i.test(d.photo)) return d.photo
      return this.PHOTOS_PATH + d.photo
    }
    return 'assets/images/blank-profile-picture.png'
  }

  /** Compte récursivement les items (étudiants) d'un ensemble de nœuds et de leurs descendants. */
  private countItems(nodes: DossierNode[]): number {
    let count = 0
    for (const node of nodes) {
      count += node.items?.length ?? 0
      count += this.countItems(node.children ?? [])
    }
    return count
  }

  /** Compte récursivement les nœuds de type 'classe' porteurs d'items. */
  private countClasses(nodes: DossierNode[]): number {
    let count = 0
    for (const node of nodes) {
      if (node.type === 'classe' && (node.items?.length ?? 0) > 0) count += 1
      count += this.countClasses(node.children ?? [])
    }
    return count
  }

  // ========================================================================
  //  Actions (batch + item)
  // ========================================================================

  onBatchAction(event: { action: string, ids: number[] }): void {
    const newStatut = this.statutMap[event.action]
    if (!newStatut || event.ids.length === 0) return

    const requetes = event.ids.map(id =>
      this.dossierEtudiantService.update(String(id), { statut: newStatut })
    )

    forkJoin(requetes).subscribe({
      next: () => this.getArbre(),
      error: (err) => {
        console.log(err)
        this.getArbre()
      }
    })
  }

  onItemAction(event: { item: any, action: string }): void {
    if (event.action === 'visualiser') {
      this.visualiserDossier(event.item.id)
    }
  }

  visualiserDossier(id: number): void {
    this.detailLoading = true
    this.showDetailModal = true
    this.dossierEtudiantService.getComplet(String(id)).subscribe({
      next: (data) => {
        this.detailData = data
        this.detailLoading = false
      },
      error: (err) => {
        console.error(err)
        this.detailLoading = false
      }
    })
  }

  closeDetailModal(): void {
    this.showDetailModal = false
    this.detailData = null
  }

  telechargerCarte(dossierId: string): void {
    const url = this.dossierEtudiantService.telechargerCarteUrl(dossierId)
    window.open(url, '_blank')
  }

  /** Télécharge un fichier via HttpClient (avec token) et l'ouvre dans un nouvel onglet */
  telechargerFichier(basePath: string, nomFichier: string): void {
    const url = `${basePath}${nomFichier}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      },
      error: (err) => {
        console.error('❌ Erreur téléchargement fichier:', err);
      }
    });
  }
}
