import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DossierEtudiant } from 'src/app/data/modules/inscription/models/DossierEtudiant.model';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';

@Component({
  selector: 'app-mon-dossier-page',
  templateUrl: './mon-dossier-page.component.html',
  styleUrls: ['./mon-dossier-page.component.scss']
})
export class MonDossierPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  dossier?: DossierEtudiant
  qrCodeData: string = ''

  constructor(
    private dossierEtudiantService: DossierEtudiantService
  ) {
    super()
    this.getMonDossier()
  }

  ngOnInit(): void {
  }

  getMonDossier(): void {
    this.dossierEtudiantService.getMonDossier().subscribe({
      next: (res) => {
        this.dossier = res
        if (this.dossier?.codeQR) {
          this.qrCodeData = this.dossier.codeQR
        }
      },
      error: (err) => {
        console.log(err)
        this.error = true
      }
    })
  }

  getStatutBadgeColor(statut: string): string {
    switch (statut) {
      case 'actif': return 'green'
      case 'suspendu': return 'yellow'
      case 'archive': return 'red'
      default: return 'gray'
    }
  }

  getStatutEcheanceColor(statut: string): string {
    switch (statut) {
      case 'paye': return 'green'
      case 'en_retard': return 'red'
      case 'impaye': return 'yellow'
      default: return 'gray'
    }
  }
}
