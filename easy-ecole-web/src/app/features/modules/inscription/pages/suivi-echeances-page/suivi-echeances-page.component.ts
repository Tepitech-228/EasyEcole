import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { DossierNode, DossierColumn } from 'src/app/shared/components/dossier-view/dossier-view.component';

/** Noeud d'un étudiant renvoyé par GET /finance/suivi-echeances */
interface EtudiantSuivi {
  dossierEtudiantId: number;
  utilisateurId: number;
  matricule: string | null;
  nom: string;
  prenoms: string;
  photo: string | null;
  totalDu: number;
  totalPaye: number;
  resteApayer: number;
  statut: 'regle' | 'partiel' | 'probleme';
  echeances: any[];
}

/** Classe du niveau dans l'arbre backend */
interface ClasseSuivi {
  classeId: number | null;
  classe: string;
  salles: string[];
  etudiants: EtudiantSuivi[];
}

@Component({
  selector: 'app-suivi-echeances-page',
  templateUrl: './suivi-echeances-page.component.html',
  styleUrls: ['./suivi-echeances-page.component.scss']
})
export class SuiviEcheancesPageComponent extends BaseComponentClass implements OnInit {

  treeNodes: DossierNode[] = [];
  loading = false;
  error = false;
  apiErrorMessage = '';

  // Statistiques globales
  nbEtudiants = 0;
  nbProbleme = 0;
  nbPartiel = 0;
  nbRegle = 0;

  readonly columns: DossierColumn[] = [
    { key: 'nom', label: 'Étudiant' },
    { key: 'matricule', label: 'Matricule', width: '130px' },
    { key: 'totalDu', label: 'Total dû', width: '130px' },
    { key: 'montantPaye', label: 'Déjà payé', width: '130px' },
    { key: 'resteApayer', label: 'Reste à payer', width: '140px' },
    { key: 'statutSuivi', label: 'Statut', width: '170px' },
  ];

  constructor(private bordereauService: BordereauService) {
    super();
  }

  ngOnInit(): void {
    this.loadSuivi();
  }

  private loadSuivi(): void {
    this.loading = true;
    this.error = false;
    this.bordereauService.getSuiviEcheances().subscribe({
      next: (arbre) => {
        this.treeNodes = this.buildTree(arbre || []);
        this.computeStats(this.treeNodes);
        this.loading = false;
      },
      error: (err) => {
        console.error('[Suivi échéances] Erreur chargement:', err);
        this.error = true;
        this.apiErrorMessage = err?.error?.message || err?.message || 'Impossible de charger le suivi des échéances.';
        this.loading = false;
      }
    });
  }

  // ========================================================================
  //  Transformation de l'arbre backend (année → filière → niveau → classe)
  //  en DossierNode[] consommable par app-dossier-view.
  //  Les étudiants sont la FEUILLE (items) de chaque classe.
  // ========================================================================
  private buildTree(arbre: any[]): DossierNode[] {
    return (arbre || []).map((annee) => ({
      type: 'annee' as const,
      label: annee.annee || 'Année inconnue',
      expanded: true,
      children: (annee.filieres || []).map((filiere: any) => ({
        type: 'parcours' as const,
        label: filiere.filiere || 'Sans parcours',
        expanded: true,
        children: (filiere.niveaux || []).map((niveau: any) => ({
          type: 'niveau' as const,
          label: niveau.niveau || '—',
          expanded: true,
          children: (niveau.classes || []).map((classe: ClasseSuivi) => ({
            type: 'classe' as const,
            label: classe.classe || '—',
            subtitle: classe.salles && classe.salles.length ? classe.salles.join(', ') : undefined,
            expanded: true,
            items: (classe.etudiants || []).map(e => this.etudiantToItem(e))
          }))
        }))
      }))
    }));
  }

  private etudiantToItem(e: EtudiantSuivi): any {
    return {
      id: e.dossierEtudiantId,
      nom: `${e.nom || ''} ${e.prenoms || ''}`.trim() || '—',
      matricule: e.matricule || '—',
      totalDu: this.formatMontant(e.totalDu),
      montantPaye: this.formatMontant(e.totalPaye),
      resteApayer: this.formatMontant(e.resteApayer),
      statut: this.getStatutLibelle(e.statut),
      statutKey: e.statut,
      rowClass: e.statut === 'probleme' ? 'probleme' : (e.statut === 'partiel' ? 'partiel' : ''),
      data: e,
    };
  }

  // ========================================================================
  //  Statistiques (résumé)
  // ========================================================================
  private computeStats(nodes: DossierNode[]): void {
    let total = 0;
    let probleme = 0;
    let partiel = 0;
    let regle = 0;

    const walk = (n: DossierNode) => {
      if (n.items && n.items.length) {
        for (const item of n.items) {
          total++;
          if (item.rowClass === 'probleme') probleme++;
          else if (item.rowClass === 'partiel') partiel++;
          else regle++;
        }
      }
      (n.children || []).forEach(walk);
    };
    nodes.forEach(walk);

    this.nbEtudiants = total;
    this.nbProbleme = probleme;
    this.nbPartiel = partiel;
    this.nbRegle = regle;
  }

  // ========================================================================
  //  Helpers d'affichage
  // ========================================================================
  private formatMontant(value: any): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    if (n <= 0) return '0 FC';
    return n.toLocaleString('fr-FR').replace(/\u202f/g, ' ') + ' FC';
  }

  private getStatutLibelle(statut: string): string {
    switch (statut) {
      case 'probleme': return 'En problème';
      case 'partiel': return 'Paiement partiel';
      case 'regle': return 'En règle';
      default: return '—';
    }
  }

  retry(): void {
    this.loadSuivi();
  }
}
