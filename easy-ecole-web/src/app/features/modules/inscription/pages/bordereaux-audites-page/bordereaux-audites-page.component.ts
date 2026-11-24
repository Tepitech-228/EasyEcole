import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Bordereau } from 'src/app/data/modules/inscription/models/Bordereau.model';
import { BordereauService } from 'src/app/data/modules/inscription/services/bordereau.service';

@Component({
  selector: 'app-bordereaux-audites-page',
  templateUrl: './bordereaux-audites-page.component.html',
})
export class BordereauxAuditesPageComponent extends BaseComponentClass implements OnInit, OnDestroy {
  bordereaux: Bordereau[] = [];
  loading = false;
  saving = false;
  searchTerm = '';
  successMessage = '';
  errorMessage = '';
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;

  selectedBordereau?: Bordereau;
  showEditModal = false;
  previewLoading = false;
  previewError = '';
  previewObjectUrl: string | null = null;
  previewUrl: SafeResourceUrl | null = null;
  correctionForm: FormGroup;

  private previewSubscription?: Subscription;

  constructor(
    private bordereauService: BordereauService,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
  ) {
    super();
    this.correctionForm = this.formBuilder.group({
      numeroBordereau: ['', [Validators.required, Validators.maxLength(100)]],
      datePaiement: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.chargerBordereaux();
  }

  get bordereauxFiltres(): Bordereau[] {
    const recherche = this.searchTerm.trim().toLocaleLowerCase();
    if (!recherche) return this.bordereaux;

    return this.bordereaux.filter(bordereau => {
      const nom = `${bordereau.utilisateur?.nom || ''} ${bordereau.utilisateur?.prenoms || ''}`.toLocaleLowerCase();
      return [
        nom,
        bordereau.numeroBordereau || '',
        bordereau.referenceBancaire || '',
        String(bordereau.id || ''),
      ].some(valeur => valeur.toLocaleLowerCase().includes(recherche));
    });
  }

  chargerBordereaux(page = this.currentPage): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPage = page;
    this.bordereauService.getAll({
      statut: 'valide,en_saisie_comptable,traite',
      page,
      limit: this.pageSize,
    }).subscribe({
      next: (response) => {
        this.bordereaux = response.data || [];
        this.totalItems = Number(response.pagination?.total || 0);
        this.totalPages = Math.max(1, Number(response.pagination?.totalPages || 1));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur de chargement des bordereaux audités:', error);
        this.errorMessage = error?.error?.message || 'Impossible de charger les bordereaux audités.';
        this.loading = false;
      },
    });
  }

  ouvrirCorrection(bordereau: Bordereau): void {
    if (!bordereau.id) return;

    this.fermerApercu();
    this.selectedBordereau = bordereau;
    this.errorMessage = '';
    this.previewError = '';
    this.correctionForm.reset({
      numeroBordereau: bordereau.numeroBordereau || '',
      datePaiement: this.formaterDateInput(bordereau.datePaiement),
    });
    this.showEditModal = true;

    this.previewLoading = true;
    this.previewSubscription = this.bordereauService.downloadBordereau(String(bordereau.id)).subscribe({
      next: (fichier) => {
        if (!fichier.size) {
          this.previewError = 'Le fichier du bordereau est vide.';
          this.previewLoading = false;
          return;
        }
        this.previewObjectUrl = URL.createObjectURL(fichier);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
        this.previewLoading = false;
      },
      error: (error) => {
        this.previewError = error?.error?.message || 'Impossible de charger le fichier du bordereau.';
        this.previewLoading = false;
      },
    });
  }

  enregistrerCorrection(): void {
    if (!this.selectedBordereau?.id || this.correctionForm.invalid || this.saving) {
      this.correctionForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    const valeur = this.correctionForm.getRawValue();
    this.bordereauService.corrigerBordereauAudite(String(this.selectedBordereau.id), {
      numeroBordereau: String(valeur.numeroBordereau || '').trim(),
      datePaiement: valeur.datePaiement,
    }).subscribe({
      next: () => {
        this.successMessage = 'Les corrections du bordereau ont été enregistrées.';
        this.saving = false;
        this.fermerCorrection();
        this.chargerBordereaux();
      },
      error: (error) => {
        console.error('Erreur de correction du bordereau audité:', error);
        this.errorMessage = error?.error?.message || 'Impossible d’enregistrer les corrections.';
        this.saving = false;
      },
    });
  }

  fermerCorrection(): void {
    this.showEditModal = false;
    this.selectedBordereau = undefined;
    this.correctionForm.reset();
    this.fermerApercu();
  }

  estImage(fichier?: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp|heic|heif)$/i.test(fichier || '');
  }

  libelleStatut(statut?: string): string {
    if (statut === 'traite') return 'Traité';
    if (statut === 'en_saisie_comptable') return 'En saisie comptable';
    return 'Audité';
  }

  formaterDateInput(date?: Date | string | null): string {
    if (!date) return '';
    if (typeof date === 'string') return date.slice(0, 10);
    return date.toISOString().slice(0, 10);
  }

  formatCurrency(value?: number | null): string {
    if (value == null) return '—';
    return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
  }

  ngOnDestroy(): void {
    this.fermerApercu();
  }

  private fermerApercu(): void {
    this.previewSubscription?.unsubscribe();
    this.previewSubscription = undefined;
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
    this.previewUrl = null;
    this.previewLoading = false;
  }
}
