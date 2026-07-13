import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TypesRessource } from 'src/app/data/enums/TypesRessource';
import { FichierRessource } from 'src/app/data/modules/inscription/models/FichierRessource.model';
import { Ressource } from 'src/app/data/modules/inscription/models/Ressource.model';
import { FichierRessourceService } from 'src/app/data/modules/inscription/services/fichier-ressource.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';
import { getClassWithColor } from 'file-icons-js';
import { RessourceService } from 'src/app/data/modules/inscription/services/ressource.service';

@Component({
  selector: 'app-ressource-card',
  templateUrl: './ressource-card.component.html',
  styleUrls: ['./ressource-card.component.scss']
})
export class RessourceCardComponent implements OnInit {

  @Input() ressource!: Ressource
  @Input() rolesValue!: RolesValueType

  showSupprimerRessourceModal: boolean = false
  readonly typesRessource = TypesRessource

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private fichierRessourceService: FichierRessourceService,
    private ressourceService: RessourceService
  ) { }

  ngOnInit(): void {
  }

  getContenu(): SafeHtml | null {
    if (this.ressource.description) {
      return this.sanitizer.bypassSecurityTrustHtml(this.ressource.description)
    }

    return null
  }

  getColor(): string {
    switch (this.ressource.type) {
      case TypesRessource.SIMPLE_DOCUMENT:
        return 'yellow'
        break;

      case TypesRessource.TRAVAIL_A_RENDRE:
        return 'green'
        break;

      case TypesRessource.TEST:
        return 'red'
        break;
    
      default:
        return 'blue'
        break;
    }
  }

  getFichierRessourceIcone(fichierRessource: FichierRessource): string {
    return getClassWithColor(fichierRessource.fichier!)
  }

  downloadFichierRessource(fichierRessource: FichierRessource): void {
    this.fichierRessourceService.download(fichierRessource.id!).subscribe(
      {
        next: (res: HttpResponse<Blob>) => {
          // console.log(res)
          const blob = res.body

          if(blob) {
            const contentDisposition = res.headers.get('Content-Disposition')
            let nomFichier = fichierRessource.fichier!
            if(contentDisposition) {
              const match = contentDisposition.split('filename=')
              // console.log(contentDisposition, match)
              if(match) {
                nomFichier = match[1]
              }
            }

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = nomFichier
            a.click()
            window.URL.revokeObjectURL(url)
          }
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          if (err.status == 404 || err.status == 403) {
            this.router.navigate(['/cours/cours/'])
          }
        },
      }
    )
  }

  supprimerRessource(): void {
    console.log(this.ressource)

    this.ressourceService.delete(this.ressource.id!).subscribe({
      next: (res) => {
        window.location.reload()
      },
      error: (err) => {
        console.log(err)
      },
    })
  }

  // Modals
  openSupprimerRessourceModal(): void {
    this.showSupprimerRessourceModal = true
  }

  closeSupprimerRessourceModal(): void {
    this.showSupprimerRessourceModal = false
  }

}
