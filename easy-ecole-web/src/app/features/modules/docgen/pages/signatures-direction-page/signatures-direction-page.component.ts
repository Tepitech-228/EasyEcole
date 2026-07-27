import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DocGenSigningService } from 'src/app/data/modules/docgen/services/docgen-signing.service';

@Component({
  selector: 'app-signatures-direction-page',
  templateUrl: './signatures-direction-page.component.html',
  styleUrls: ['./signatures-direction-page.component.scss']
})
export class SignaturesDirectionPageComponent extends BaseComponentClass implements OnInit {
  groupes: any[] = [];
  documents: any[] = [];
  selectedClasse: string = '';
  loading = false;
  signing = false;

  constructor(private signingService: DocGenSigningService) { super(); }

  ngOnInit(): void {
    this.loadGroupes();
  }

  get pendingCount(): number {
    return (this.documents || []).filter(d => d.statut === 'en_attente_directeur').length;
  }

  loadGroupes(): void {
    this.signingService.getPendingForDirector().subscribe({
      next: (res) => this.groupes = res,
      error: () => {}
    });
  }

  selectClasse(classe: string): void {
    this.selectedClasse = classe;
    this.loading = true;
    this.signingService.getDocumentsByClasse(classe, 'en_attente_directeur').subscribe({
      next: (res) => { this.documents = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  toutSigner(): void {
    const ids = this.documents.filter(d => d.statut === 'en_attente_directeur').map(d => d.id).filter(Boolean);
    if (!ids.length) return;
    if (!confirm(`Signer ${ids.length} document(s) avec le cachet officiel ?`)) return;
    this.signing = true;
    const signataireId = parseInt(BaseComponentClass.utilisateur?.id || '0', 10);
    this.signingService.signBatch(ids, signataireId, 'directeur').subscribe({
      next: () => { this.signing = false; this.selectClasse(this.selectedClasse); this.loadGroupes(); },
      error: () => { this.signing = false; alert('Erreur lors de la signature'); }
    });
  }
}
