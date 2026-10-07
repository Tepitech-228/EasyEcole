import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DossierInscriptionService } from 'src/app/data/modules/inscription/services/dossier-inscription.service';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';

interface PieceAReposer {
  dossierId: number | string;
  nomFichier: string;
  dossierInscription?: { titre?: string };
}

@Component({
  selector: 'app-inscription-correction-documents-page',
  templateUrl: './inscription-correction-documents-page.component.html',
  styleUrls: ['./inscription-correction-documents-page.component.scss']
})
export class InscriptionCorrectionDocumentsPageComponent implements OnInit {
  demande: any = null;
  pieces: PieceAReposer[] = [];
  fichiers: { [dossierId: string]: File } = {};
  loading = true;
  submitting = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeInscriptionService,
    private dossierService: DossierInscriptionService
  ) {}

  ngOnInit(): void {
    const demandeId = this.route.snapshot.paramMap.get('id');
    if (!demandeId) {
      this.errorMessage = 'Demande introuvable.';
      this.loading = false;
      return;
    }

    this.demandeService.get(demandeId).subscribe({
      next: (demande: any) => {
        if (demande.statutPipeline !== 'correction_demandee') {
          this.router.navigate(['/inscription/demandes', demandeId]);
          return;
        }
        this.demande = demande;
        this.pieces = (demande.dossiersDemande || []).filter((piece: any) => piece.correctionDemandee);
        if (this.pieces.length === 0) {
          this.errorMessage = 'Aucune pièce ne nécessite de remplacement pour cette demande.';
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les pièces à remplacer.';
        this.loading = false;
      }
    });
  }

  titrePiece(piece: PieceAReposer): string {
    return piece.dossierInscription?.titre || piece.nomFichier || 'Pièce à remplacer';
  }

  onFileSelected(event: Event, piece: PieceAReposer): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) return;

    const extension = `.${fichier.name.split('.').pop() || ''}`.toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(extension)) {
      this.errorMessage = 'Formats acceptés : PDF, JPG, JPEG ou PNG.';
      input.value = '';
      return;
    }
    if (fichier.size > 20 * 1024 * 1024) {
      this.errorMessage = 'La taille maximale autorisée est de 20 Mo.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.fichiers[String(piece.dossierId)] = fichier;
    input.value = '';
  }

  get toutesLesPiecesSelectionnees(): boolean {
    return this.pieces.length > 0 && this.pieces.every(piece => !!this.fichiers[String(piece.dossierId)]);
  }

  soumettreCorrections(): void {
    if (this.submitting || !this.demande?.id || !this.toutesLesPiecesSelectionnees) return;
    this.submitting = true;
    this.errorMessage = '';
    const piecesAAttendre = [...this.pieces];

    const televerserSuivant = (index: number): void => {
      if (index >= piecesAAttendre.length) {
        this.submitting = false;
        this.submitted = true;
        return;
      }

      const piece = piecesAAttendre[index];
      const dossierId = String(piece.dossierId);
      const fichier = this.fichiers[dossierId];
      this.dossierService.uploadMultiple(String(this.demande.id), dossierId, [fichier]).subscribe({
        next: event => {
          if (event.type === HttpEventType.Response) {
            this.pieces = this.pieces.filter(item => String(item.dossierId) !== dossierId);
            delete this.fichiers[dossierId];
            televerserSuivant(index + 1);
          }
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Une pièce n’a pas pu être envoyée. Vous pourrez réessayer sans perdre les pièces déjà remplacées.';
          this.submitting = false;
        }
      });
    };

    televerserSuivant(0);
  }

  retourTableauDeBord(): void {
    this.router.navigate(['/']);
  }
}