import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';
import { DocGenDocument } from 'src/app/data/modules/docgen/models/DocGenDocument.model';
import { DocGenType } from 'src/app/data/modules/docgen/models/DocGenType.model';
import { DocGenDocumentService } from 'src/app/data/modules/docgen/services/docgen-document.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { TypeDocument } from 'src/app/data/modules/scolarite/models/TypeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { TypeDocumentService } from 'src/app/data/modules/scolarite/services/type-document.service';

/**
 * Page « Génération de documents » (route /docgen/generer) — gérée par le secrétaire.
 *
 * Onglet 1 — Reçus de scolarité : liste d'attente des bordereaux de scolarité
 *           validés par le cabinet comptable. Le secrétaire génère le reçu
 *           (PDF + envoi par mail) ou une copie physique imprimable.
 * Onglet 2 — Attestations & documents : demandes de documents payantes des
 *           étudiants (frais paramétrés) — paiement en caisse puis délivrance.
 * Onglet 3 — Paramétrage des frais : montants unitaires par type de document.
 */
@Component({
  selector: 'app-generate-document-page',
  templateUrl: './generate-document-page.component.html',
  styleUrls: ['./generate-document-page.component.scss']
})
export class GenerateDocumentPageComponent extends BaseComponentClass implements OnInit {
  /** Code du type docgen « Reçu de scolarité » (créé côté serveur). */
  static readonly RECU_SCOLARITE_TYPE_CODE = 'REC001';

  activeTab: 'recus' | 'demandes' | 'frais' = 'recus';

  // ---- Onglet 1 : reçus de scolarité ----
  recusLoading = false;
  recus: Bordereau[] = [];
  /** Documents docgen déjà générés pour un bordereau (sourceType=bordereau). */
  recusGenereParBordereau = new Map<string, DocGenDocument>();
  genererLoadingId: string | null = null;
  recuTypePresent = false;

  // ---- Onglet 2 : attestations & documents payants ----
  demandesLoading = false;
  demandes: DemandeDocument[] = [];
  paiementLoadingId: string | null = null;
  delivranceLoadingId: string | null = null;

  // ---- Onglet 3 : paramétrage des frais ----
  typesDocLoading = false;
  typesDocument: TypeDocument[] = [];
  typeFormOpen = false;
  typeFormMode: 'create' | 'edit' = 'create';
  typeForm: { id?: string; libelle: string; frais: number } = { libelle: '', frais: 0 };
  typeSaveLoading = false;
  typeDeleteLoadingId: string | null = null;

  // ---- Messages ----
  errorMessage = '';
  successMessage = '';

  constructor(
    private bordereauService: BordereauService,
    private docgenDocumentService: DocGenDocumentService,
    private docgenTypeService: DocGenTypeService,
    private demandeDocumentService: DemandeDocumentService,
    private typeDocumentService: TypeDocumentService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadTypes();
    this.loadRecus();
    this.loadDemandes();
    this.loadTypesDocument();
  }

  // ================= Onglet 1 : Reçus de scolarité =================

  /** Vérifie que le type docgen « Reçu de scolarité » existe côté serveur. */
  private loadTypes(): void {
    this.docgenTypeService.getAll().subscribe({
      next: (types: DocGenType[]) => {
        this.recuTypePresent = types.some(
          t => t.code === GenerateDocumentPageComponent.RECU_SCOLARITE_TYPE_CODE
            || (t.libelle || '').toLowerCase().includes('reçu de scolarité')
        );
      },
      error: () => this.recuTypePresent = false,
    });
  }

  /** Liste d'attente : bordereaux de scolarité validés par le cabinet comptable. */
  loadRecus(): void {
    this.recusLoading = true;
    this.errorMessage = '';

    this.bordereauService.getAll({ type: 'scolarite', statut: 'valide', limit: 100 }).subscribe({
      next: (res) => {
        this.recus = res.data || [];
        this.recusLoading = false;
        this.loadRecusGenere();
      },
      error: () => {
        this.recusLoading = false;
        this.errorMessage = 'Erreur lors du chargement de la liste d\'attente des reçus';
      }
    });
  }

  /** Récupère les reçus déjà générés (pour les sortir de l'attente et permettre la copie physique). */
  private loadRecusGenere(): void {
    this.docgenDocumentService.getAll({ sourceType: 'bordereau' }).subscribe({
      next: (docs: DocGenDocument[]) => {
        this.recusGenereParBordereau.clear();
        (docs || []).forEach(doc => {
          if (doc.sourceId != null) this.recusGenereParBordereau.set(String(doc.sourceId), doc);
        });
      },
      error: () => { /* non bloquant */ }
    });
  }

  recuGenere(bordereau: Bordereau): DocGenDocument | undefined {
    if (!bordereau.id) return undefined;
    return this.recusGenereParBordereau.get(String(bordereau.id));
  }

  /** Génère le reçu de scolarité (PDF) et le fait envoyer par mail à l'étudiant. */
  genererRecu(bordereau: Bordereau): void {
    if (!bordereau.id) return;

    if (!this.recuTypePresent) {
      this.errorMessage = 'Le type de document « Reçu de scolarité » (code REC001) doit être créé côté serveur (module DocGen).';
      return;
    }

    this.genererLoadingId = bordereau.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.docgenDocumentService.generate({
      typeCode: GenerateDocumentPageComponent.RECU_SCOLARITE_TYPE_CODE,
      sourceType: 'bordereau',
      sourceId: Number(bordereau.id),
      envoyerMail: true,
      metadata: { bordereauId: Number(bordereau.id), montant: Number(bordereau.montant) || 0 },
    }).subscribe({
      next: (res: any) => {
        this.genererLoadingId = null;
        const docs: DocGenDocument[] = res?.data || [];
        docs.forEach(d => {
          if (d.sourceId != null) this.recusGenereParBordereau.set(String(d.sourceId), d);
        });
        const etudiant = bordereau.utilisateur;
        const nom = etudiant ? `${etudiant.nom || ''} ${etudiant.prenoms || ''}`.trim() : '';
        this.successMessage = `Reçu généré pour ${nom || 'l\'étudiant'} (${docs.length} document). Un mail a été envoyé à l'étudiant avec le PDF en pièce jointe.`;
      },
      error: (err) => {
        this.genererLoadingId = null;
        this.errorMessage = err?.error?.message || err?.message || 'Erreur lors de la génération du reçu';
      }
    });
  }

  /** Copie physique : télécharge le PDF du reçu déjà généré pour impression. */
  telechargerRecu(doc: DocGenDocument): void {
    if (!doc.id) return;
    this.docgenDocumentService.download(doc.id).subscribe({
      next: (blob: Blob) => this.saveBlob(blob, `${doc.reference || 'recu'}.pdf`),
      error: () => this.errorMessage = 'Impossible de télécharger le reçu'
    });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ================= Onglet 2 : Attestations & documents payants =================

  loadDemandes(): void {
    this.demandesLoading = true;
    this.demandeDocumentService.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.demandes = res?.data || res || [];
        this.demandesLoading = false;
      },
      error: () => {
        this.demandesLoading = false;
      }
    });
  }

  /** Confirme l'encaissement (caisse en espèces) d'une demande de document payante. */
  confirmerPaiement(demande: DemandeDocument): void {
    if (!demande.id) return;
    if (demande.fraisPayes) {
      this.errorMessage = 'Cette demande est déjà réglée.';
      return;
    }
    this.paiementLoadingId = demande.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeDocumentService.confirmerPaiement(demande.id).subscribe({
      next: () => {
        this.paiementLoadingId = null;
        this.successMessage = 'Paiement encaissé avec succès.';
        this.loadDemandes();
      },
      error: (err) => {
        this.paiementLoadingId = null;
        this.errorMessage = err?.error?.message || 'Erreur lors de la confirmation du paiement';
      }
    });
  }

  /** Délivre le document (génère le PDF côté serveur) une fois le paiement acquitté. */
  delivrerDocument(demande: DemandeDocument): void {
    if (!demande.id) return;
    if (Number(demande.montant) > 0 && !demande.fraisPayes) {
      this.errorMessage = 'Paiement requis avant délivrance du document (caisse).';
      return;
    }
    this.delivranceLoadingId = demande.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeDocumentService.updateStatus(demande.id, 'delivree').subscribe({
      next: () => {
        this.delivranceLoadingId = null;
        this.successMessage = 'Document délivré avec succès.';
        this.loadDemandes();
      },
      error: (err) => {
        this.delivranceLoadingId = null;
        this.errorMessage = err?.error?.message || 'Erreur lors de la délivrance du document';
      }
    });
  }

  montantDemande(demande: DemandeDocument): number {
    return Number(demande.montant) || 0;
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'soumise': return 'Soumise';
      case 'validee': return 'Validée';
      case 'rejetee': return 'Rejetée';
      case 'delivree': return 'Délivrée';
      default: return statut || '';
    }
  }

  statutBadgeClass(statut: string): string {
    switch (statut) {
      case 'soumise': return 'bg-yellow-100 text-yellow-700';
      case 'validee': return 'bg-blue-100 text-blue-700';
      case 'rejetee': return 'bg-red-100 text-red-700';
      case 'delivree': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  // ================= Onglet 3 : Paramétrage des frais =================

  loadTypesDocument(): void {
    this.typesDocLoading = true;
    this.typeDocumentService.getAll().subscribe({
      next: (types: TypeDocument[]) => {
        this.typesDocument = types || [];
        this.typesDocLoading = false;
      },
      error: () => {
        this.typesDocLoading = false;
        this.errorMessage = 'Erreur lors du chargement des types de documents';
      }
    });
  }

  openCreateType(): void {
    this.typeFormMode = 'create';
    this.typeForm = { libelle: '', frais: 0 };
    this.typeFormOpen = true;
    this.errorMessage = '';
  }

  openEditType(type: TypeDocument): void {
    this.typeFormMode = 'edit';
    this.typeForm = { id: type.id, libelle: type.libelle || '', frais: Number(type.frais) || 0 };
    this.typeFormOpen = true;
    this.errorMessage = '';
  }

  closeTypeForm(): void {
    this.typeFormOpen = false;
  }

  saveType(): void {
    if (!this.typeForm.libelle || this.typeForm.libelle.trim() === '') {
      this.errorMessage = 'Le libellé du document est requis';
      return;
    }

    this.typeSaveLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: TypeDocument = {
      libelle: this.typeForm.libelle.trim(),
      frais: Number(this.typeForm.frais) || 0,
    };

    const request$ = this.typeFormMode === 'edit' && this.typeForm.id
      ? this.typeDocumentService.update({ ...payload, id: this.typeForm.id })
      : this.typeDocumentService.create(payload);

    request$.subscribe({
      next: () => {
        this.typeSaveLoading = false;
        this.typeFormOpen = false;
        this.successMessage = this.typeFormMode === 'edit'
          ? 'Frais du document mis à jour avec succès.'
          : 'Type de document créé avec succès.';
        this.loadTypesDocument();
      },
      error: () => {
        this.typeSaveLoading = false;
        this.errorMessage = 'Erreur lors de l\'enregistrement du type de document';
      }
    });
  }

  deleteType(type: TypeDocument): void {
    if (!type.id) return;
    this.typeDeleteLoadingId = type.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.typeDocumentService.delete(type.id).subscribe({
      next: () => {
        this.typeDeleteLoadingId = null;
        this.successMessage = 'Type de document supprimé.';
        this.loadTypesDocument();
      },
      error: (err) => {
        this.typeDeleteLoadingId = null;
        this.errorMessage = err?.error?.message || 'Erreur lors de la suppression (des demandes existent peut-être)';
      }
    });
  }

  formatMontant(montant: number | undefined | null): string {
    return `${(Number(montant) || 0).toLocaleString('fr-FR')} FCFA`;
  }

  /** Nom complet « Nom Prénoms » d'un utilisateur (repli propre si champs absents). */
  etudiantLabel(utilisateur: any): string {
    if (!utilisateur) return '—';
    const nom = String(utilisateur.nom || '').trim();
    const prenoms = String(utilisateur.prenoms || '').trim();
    const label = [nom, prenoms].filter(Boolean).join(' ');
    return label || '—';
  }
}