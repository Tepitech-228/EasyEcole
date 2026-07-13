import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChapitreCours } from 'src/app/data/modules/inscription/models/ChapitreCours.model';
import { ChapitreCoursService } from 'src/app/data/modules/inscription/services/chapitre-cours.service';
import { RolesValueType } from 'src/app/data/types/RolesValueType';

@Component({
  selector: 'app-chapitre-card',
  templateUrl: './chapitre-card.component.html',
  styleUrls: ['./chapitre-card.component.scss']
})
export class ChapitreCardComponent implements OnInit {

  @Input() chapitre!: ChapitreCours
  @Input() color: string = 'blue'
  @Input() rolesValue!: RolesValueType

  showSupprimerChapitreCoursModal: boolean = false

  constructor(
    private sanitizer: DomSanitizer,
    private chapitreCoursService: ChapitreCoursService
  ) { }

  ngOnInit(): void {
  }

  getContenu(): SafeHtml | null {
    if (this.chapitre.description) {
      return this.sanitizer.bypassSecurityTrustHtml(this.chapitre.description)
    }

    return null
  }

  supprimerChapitreCours(): void {
    console.log(this.chapitre)

    this.chapitreCoursService.delete(this.chapitre.id!).subscribe({
      next: (res) => {
        window.location.reload()
      },
      error: (err) => {
        console.log(err)
      },
    })
  }

  // Modals
  openSupprimerChapitreCoursModal(): void {
    this.showSupprimerChapitreCoursModal = true
  }

  closeSupprimerChapitreCoursModal(): void {
    this.showSupprimerChapitreCoursModal = false
  }

}
