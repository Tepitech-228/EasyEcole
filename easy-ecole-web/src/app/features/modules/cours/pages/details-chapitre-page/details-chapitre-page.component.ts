import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ChapitreCours } from 'src/app/data/modules/inscription/models/ChapitreCours.model';
import { ChapitreCoursService } from 'src/app/data/modules/inscription/services/chapitre-cours.service';
import { TypesRessource } from 'src/app/data/enums/TypesRessource';

@Component({
  selector: 'app-details-chapitre-page',
  templateUrl: './details-chapitre-page.component.html',
  styleUrls: ['./details-chapitre-page.component.scss']
})
export class DetailsChapitrePageComponent extends BaseComponentClass implements OnInit {

  alreadyExists: boolean = false
  error: boolean = false

  chapitreId: string
  chapitre?: ChapitreCours
  readonly typesRessource = TypesRessource

  showNouvelleRessourceModal: boolean = false 

  constructor(
    private chapitreCoursService: ChapitreCoursService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    super()
    this.chapitreId = this.activatedRoute.snapshot.paramMap.get("chapitre") as string
    this.getChapitre()
  }

  ngOnInit(): void {
  }

  getChapitre(): void {
    this.chapitreCoursService.get(this.chapitreId)
      .subscribe(
        {
          next: (res) => {
            this.chapitre = res
            console.log(this.chapitre)
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

  // Modals
  openNouvelleRessourceModal(): void {
    this.showNouvelleRessourceModal = true
  }
  closeNouvelleRessourceModal(): void {
    this.showNouvelleRessourceModal = false
  }

}
