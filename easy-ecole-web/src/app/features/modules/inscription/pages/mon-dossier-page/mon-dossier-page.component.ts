import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DossierEtudiant } from 'src/app/data/modules/inscription/models/DossierEtudiant.model';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-mon-dossier-page',
  templateUrl: './mon-dossier-page.component.html',
  styleUrls: ['./mon-dossier-page.component.scss']
})
export class MonDossierPageComponent extends BaseComponentClass implements OnInit {

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  error: boolean = false
  dossier?: DossierEtudiant
  qrCodeData: string = ''

  constructor(
    private dossierEtudiantService: DossierEtudiantService,
    private router: Router
  ) {
    super()
  }

  ngOnInit(): void {
    if (this.rolesValue.isAdmin || this.rolesValue.isInstitution) {
      this.router.navigate(['/inscription/dossiers'])
      return
    }
    this.getMonDossier()
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

  getPhotoUrl(): string {
    if (this.dossier?.utilisateur?.apprenant?.photo) {
      return this.PHOTOS_PATH + this.dossier.utilisateur.apprenant.photo
    }
    return 'assets/images/blank-profile-picture.png'
  }

  getStatutBadgeColor(statut?: string): string {
    switch (statut) {
      case 'actif': return 'green'
      case 'suspendu': return 'yellow'
      case 'archive': return 'red'
      default: return 'gray'
    }
  }

  getStatutEcheanceColor(statut?: string): string {
    switch (statut) {
      case 'paye': return 'green'
      case 'en_retard': return 'red'
      case 'impaye': return 'yellow'
      default: return 'gray'
    }
  }

  encodeURIComponent(value: string): string {
    return encodeURIComponent(value)
  }
}
