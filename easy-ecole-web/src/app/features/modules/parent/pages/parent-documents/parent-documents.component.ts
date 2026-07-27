import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ParentService, Enfant, DocumentData } from '../../services/parent.service';

@Component({
  selector: 'app-parent-documents',
  templateUrl: './parent-documents.component.html',
  styleUrls: ['./parent-documents.component.scss']
})
export class ParentDocumentsComponent implements OnInit {
  enfants: Enfant[] = [];
  selectedEnfant: Enfant | null = null;
  documents: DocumentData[] = [];
  loading = false;

  constructor(
    private parentService: ParentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.parentService.getEnfants().subscribe({
      next: (enfants) => {
        this.enfants = enfants;
        const apprenantId = Number(this.route.snapshot.params['apprenantId']);
        this.selectedEnfant = enfants.find(e => e.apprenantId === apprenantId) || enfants[0] || null;
        if (this.selectedEnfant) this.loadDocuments();
      }
    });
  }

  onEnfantChange(): void {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    if (!this.selectedEnfant) return;
    this.loading = true;
    this.parentService.getDocuments(this.selectedEnfant.apprenantId).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  download(doc: DocumentData): void {
    window.open(doc.url, '_blank');
  }
}
