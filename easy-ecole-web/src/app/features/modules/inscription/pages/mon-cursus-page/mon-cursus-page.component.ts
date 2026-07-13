import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CursusApprenant } from 'src/app/data/modules/inscription/models/CursusApprenant.model';
import { CursusApprenantService } from 'src/app/data/modules/inscription/services/cursus-apprenant.service';

@Component({
  selector: 'app-mon-cursus-page',
  templateUrl: './mon-cursus-page.component.html',
  styleUrls: ['./mon-cursus-page.component.scss']
})
export class MonCursusPageComponent extends BaseComponentClass implements OnInit {


  showNouveauCursusModal: boolean = false
  showDetailsCursusModal: boolean = false

  private cursusApprenant: CursusApprenant[] = []
  cursusApprenantInternes: CursusApprenant[] = []
  cursusApprenantExternes: CursusApprenant[] = []

  constructor(
    private cursusApprenantService: CursusApprenantService
  ) {
    super()
    this.getCursusApprenant()
  }

  ngOnInit(): void {
  }

  getCursusApprenant(): void {
    this.cursusApprenantService.getAll()
    .subscribe(
      {
        next: (res) => {
          this.cursusApprenant = res
          this.cursusApprenantInternes = this.cursusApprenant.filter(value => !value.externe)
          this.cursusApprenantExternes = this.cursusApprenant.filter(value => value.externe)
        },
        error: (err) => {
          console.log(err)
        },
      }
    )
  }

  ajouterNouveauCursus(): void {

  }

}
