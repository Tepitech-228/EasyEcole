import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeDocument, DemandeDocumentPiece } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';

@Component({
  selector: 'app-comite-demandes-documents-page',
  templateUrl: './comite-demandes-documents-page.component.html',
  styleUrls: ['./comite-demandes-documents-page.component.scss']
})
export class ComiteDemandesDocumentsPageComponent extends BaseComponentClass implements OnInit {
  demandes: DemandeDocument[] = [];
  chargement = false;
  voteEnCoursId: string | null = null;
  motifs: Record<string, string> = {};
  errorMessage = '';
  successMessage = '';
  readonly membreId = Number(BaseComponentClass.utilisateur.id);

  constructor(private demandeService: DemandeDocumentService) {
    super();
  }

  ngOnInit(): void {
    this.chargerDemandes();
  }

  chargerDemandes(): void {
    this.chargement = true;
    this.errorMessage = '';
    this.demandeService.getDemandesComite().subscribe({
      next: result => {
        this.demandes = result.data || [];
        this.chargement = false;
      },
      error: err => {
        this.chargement = false;
        this.errorMessage = err?.error?.message || 'Impossible de charger les demandes à valider.';
      }
    });
  }

  aDejaVote(demande: DemandeDocument): boolean {
    return (demande.votesComite || []).some(vote =>
      Number(vote.membreId) === this.membreId && vote.tour === demande.tourComite
    );
  }

  nombreVotes(demande: DemandeDocument): number {
    return (demande.votesComite || []).filter(vote =>
      vote.tour === demande.tourComite
    ).length;
  }

  voter(demande: DemandeDocument, decision: 'valider' | 'corriger'): void {
    if (!demande.id || this.voteEnCoursId) return;
    const motif = this.motifs[demande.id]?.trim();
    if (decision === 'corriger' && !motif) {
      this.errorMessage = 'Indiquez les corrections demandées à l’étudiant.';
      return;
    }
    this.voteEnCoursId = demande.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.demandeService.voterComite(demande.id, decision, motif).subscribe({
      next: result => {
        this.voteEnCoursId = null;
        if (result.unanimite) {
          this.successMessage = 'Validation unanime : le document est généré et transmis au secrétariat.';
        } else if (decision === 'corriger') {
          this.successMessage = 'La correction a été demandée à l’étudiant.';
        } else {
          this.successMessage = `Votre vote est enregistré (${result.votesExprimes}/${result.votesRequis}).`;
        }
        this.chargerDemandes();
      },
      error: err => {
        this.voteEnCoursId = null;
        this.errorMessage = err?.error?.message || 'Impossible d’enregistrer votre vote.';
      }
    });
  }

  ouvrirPiece(demande: DemandeDocument, piece: DemandeDocumentPiece): void {
    if (!demande.id) return;
    const fenetre = window.open('', '_blank');
    this.demandeService.telechargerPiece(demande.id, piece.id).subscribe({
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
