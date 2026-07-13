import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BibliothequeService, Livre } from 'src/app/data/modules/scolarite/services/bibliotheque.service';

@Component({
  selector: 'app-bibliotheque-page',
  templateUrl: './bibliotheque-page.component.html',
  styleUrls: ['./bibliotheque-page.component.scss']
})
export class BibliothequePageComponent extends BaseComponentClass implements OnInit {
  livres: Livre[] = []
  loading: boolean = true
  selectedLivre: Livre | null = null
  showPdfViewer: boolean = false
  pdfSrc: string = ''
  searchTerm: string = ''

  constructor(private bibliothequeService: BibliothequeService) {
    super()
  }

  ngOnInit(): void {
    this.loadLivres()
  }

  loadLivres(): void {
    this.loading = true
    this.bibliothequeService.getAll().subscribe({
      next: (res) => {
        this.livres = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  get filteredLivres(): Livre[] {
    if (!this.searchTerm) return this.livres
    const t = this.searchTerm.toLowerCase()
    return this.livres.filter(l =>
      l.titre.toLowerCase().includes(t) ||
      l.auteur.toLowerCase().includes(t)
    )
  }

  consulterLivre(livre: Livre): void {
    this.selectedLivre = livre
    this.pdfSrc = this.bibliothequeService.getDownloadUrl(livre.id)
    this.showPdfViewer = true
    this.bibliothequeService.consulter(livre.id).subscribe()
  }

  closePdfViewer(): void {
    this.showPdfViewer = false
    this.selectedLivre = null
  }
}
