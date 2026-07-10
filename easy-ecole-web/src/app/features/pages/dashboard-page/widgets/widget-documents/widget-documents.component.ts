import { Component, OnInit } from '@angular/core';
import { DemandeDocumentService } from 'src/app/data/modules/scolarite/services/demande-document.service';
import { DemandeDocument } from 'src/app/data/modules/scolarite/models/DemandeDocument.model';

@Component({
  selector: 'app-widget-documents',
  templateUrl: './widget-documents.component.html',
  styleUrls: ['./widget-documents.component.scss']
})
export class WidgetDocumentsComponent implements OnInit {
  demandes: DemandeDocument[] = []
  loading: boolean = true

  constructor(private demandeDocumentService: DemandeDocumentService) {}

  ngOnInit(): void {
    this.demandeDocumentService.getAll().subscribe({
      next: (data) => {
        this.demandes = (data || []).slice(0, 5)
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      soumise: 'Soumise',
      validee: 'Validée',
      rejetee: 'Rejetée',
      delivree: 'Délivrée'
    }
    return labels[statut] || statut
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      soumise: 'badge-warning',
      validee: 'badge-info',
      rejetee: 'badge-danger',
      delivree: 'badge-success'
    }
    return classes[statut] || 'badge-default'
  }
}
