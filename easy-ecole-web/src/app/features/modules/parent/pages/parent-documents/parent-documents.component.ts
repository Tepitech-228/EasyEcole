import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ParentService, Enfant, DocumentData } from '../../services/parent.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { environment } from 'src/environments/environment';

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
    private route: ActivatedRoute,
    private localStorage: LocalStorageService
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
    if (!doc?.url) return;
    let url = doc.url;
    // Préfixe la base API si le backend renvoie un chemin relatif
    if (/^https?:\/\//i.test(url)) {
      // déjà absolue
    } else if (url.startsWith('/')) {
      url = environment.API_URL + url;
    } else {
      url = `${environment.API_URL}/${url}`;
    }
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN);
    if (token) url += `${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
  }
}
