import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeDocument, DemandeDocumentPiece } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';

interface PieceDemandee {
  cle: string;
  libelle: string;
  obligatoire: boolean;
}

@Component({
  selector: 'app-demande-document-wizard-page',
  templateUrl: './demande-document-wizard-page.component.html',
  styleUrls: ['./demande-document-wizard-page.component.scss']
})
export class DemandeDocumentWizardPageComponent extends BaseComponentClass implements OnInit {
  demande: DemandeDocument | null = null;
  etape = 1;
  loading = true;
  saving = false;
  uploadingCle: string | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeDocumentService
  ) {
    super();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Identifiant de demande absent.';
      this.loading = false;
      return;
    }
    this.chargerDemande(id);
  }

  get id(): string {
    return this.demande?.id || this.route.snapshot.paramMap.get('id') || '';
  }

  get estModifiable(): boolean {
    return this.demande?.statut === 'brouillon' || this.demande?.statut === 'rejetee';
  }

  get piecesDemandees(): PieceDemandee[] {
    const pieces = this.demande?.typeDocument?.piecesRequises || [];
    const demandes = pieces.map(piece => ({
      cle: piece.cle,
      libelle: piece.libelle,
      obligatoire: piece.obligatoire !== false
    }));
    if (Number(this.demande?.montant) > 0) {
      demandes.push({ cle: 'bordereau', libelle: 'Bordereau de paiement', obligatoire: true });
    }
    return demandes;
  }

  get piecesManquantes(): PieceDemandee[] {
    const obligatoiresAbsentes = this.piecesDemandees.filter(piece => {
      const fichier = this.pieceCourante(piece.cle);
      return piece.obligatoire && (!fichier || fichier.statutAudit === 'rejetee');
    });
    const piecesRefusees = (this.demande?.pieces || [])
      .filter(fichier => fichier.statutAudit === 'rejetee')
      .map(fichier => ({ cle: fichier.cle, libelle: fichier.libelle, obligatoire: true }));
    const pieces = [...obligatoiresAbsentes, ...piecesRefusees];
    return pieces.filter((piece, index) => pieces.findIndex(candidate => candidate.cle === piece.cle) === index);
  }

  get libellesPiecesManquantes(): string {
    return this.piecesManquantes.map(piece => piece.libelle).join(', ');
  }

  pieceCourante(cle: string): DemandeDocumentPiece | undefined {
    return this.demande?.pieces?.find(piece => piece.cle === cle);
  }

  chargerDemande(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.demandeService.get(id).subscribe({
      next: demande => {
        this.demande = demande;
        this.etape = Math.min(3, Math.max(1, Number(demande.etapeWizard) || 1));
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger cette demande.';
      }
    });
  }

  surSelectionFichier(cle: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier || !this.id) return;
    const formats = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!formats.includes(fichier.type)) {
      this.errorMessage = 'Formats acceptés : PDF, JPG ou PNG.';
      input.value = '';
      return;
    }
    if (fichier.size > 20 * 1024 * 1024) {
      this.errorMessage = 'La taille maximale autorisée est de 20 Mo.';
      input.value = '';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.uploadingCle = cle;
    this.demandeService.televerserPiece(this.id, cle, fichier).subscribe({
      next: () => {
        this.uploadingCle = null;
        this.successMessage = `La pièce « ${fichier.name} » a été enregistrée.`;
        this.chargerDemande(this.id);
        input.value = '';
      },
      error: err => {
        this.uploadingCle = null;
        this.errorMessage = err?.error?.message || 'Impossible de téléverser cette pièce.';
        input.value = '';
      }
    });
  }

  allerEtape(etape: number): void {
    if (!this.estModifiable || etape < 1 || etape > 3 || this.saving) return;
    if (etape > this.etape && this.piecesManquantes.length > 0) {
      this.errorMessage = `Ajoutez les pièces obligatoires : ${this.piecesManquantes.map(piece => piece.libelle).join(', ')}.`;
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.demandeService.sauvegarderProgression(this.id, etape).subscribe({
      next: demande => {
        this.demande = { ...this.demande, ...demande };
        this.etape = etape;
        this.saving = false;
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Impossible d’enregistrer votre progression.';
      }
    });
  }

  soumettre(): void {
    if (!this.estModifiable || this.saving) return;
    if (this.piecesManquantes.length > 0) {
      this.errorMessage = `Ajoutez les pièces obligatoires : ${this.piecesManquantes.map(piece => piece.libelle).join(', ')}.`;
      this.etape = 1;
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.demandeService.soumettreWizard(this.id).subscribe({
      next: demande => {
        this.demande = { ...this.demande, ...demande };
        this.saving = false;
        this.successMessage = 'Votre demande a été soumise et reste consultable dans votre historique.';
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Impossible de soumettre cette demande.';
      }
    });
  }

  retourListe(): void {
    this.router.navigate(['/scolarite/demandes-documents']);
  }

  ouvrirPiece(piece: DemandeDocumentPiece): void {
    if (!this.demande?.id) return;
    const fenetre = window.open('', '_blank');
    this.demandeService.telechargerPiece(this.demande.id, piece.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        if (fenetre) {
          fenetre.location.href = url;
        } else {
          const lien = document.createElement('a');
          lien.href = url;
          lien.download = piece.nomOriginal;
          lien.click();
          URL.revokeObjectURL(url);
        }
      },
      error: err => {
        if (fenetre) fenetre.close();
        this.errorMessage = err?.error?.message || 'Impossible d’ouvrir cette pièce.';
      }
    });
  }
}
