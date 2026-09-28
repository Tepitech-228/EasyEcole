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
  selectedCursus: any = null
  coursDetails: any = null
  loadingDetails: boolean = false

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

  openDetailsModal(cursus: any): void {
    this.selectedCursus = cursus
    this.showDetailsCursusModal = true
    this.loadCoursDetails(cursus.id)
  }

  closeDetailsModal(): void {
    this.showDetailsCursusModal = false
    this.selectedCursus = null
    this.coursDetails = null
  }

  private loadCoursDetails(cursusId: string): void {
    this.loadingDetails = true
    this.coursusApprenantService.getCoursChoisis(cursusId).subscribe({
      next: (res) => {
        this.coursDetails = res
        this.loadingDetails = false
      },
      error: (err) => {
        console.error('Erreur chargement cours:', err)
        this.loadingDetails = false
      }
    })
  }

  getUeList(): any[] {
    if (!this.coursDetails?.coursParticipants) return []
    return this.coursDetails.coursParticipants.map((cp: any) => ({
      id: cp.cours?.id,
      code: cp.cours?.code,
      intitule: cp.cours?.intitule,
      semestre: cp.cours?.semestre,
      credit: cp.cours?.credit,
      enseignant: cp.cours?.enseignant ? `${cp.cours.enseignant.utilisateur?.nom || ''} ${cp.cours.enseignant.utilisateur?.prenoms || ''}`.trim() : '—'
    }))
  }

  getEcueList(ueId: number): any[] {
    if (!this.coursDetails?.coursParticipants) return []
    const participant = this.coursDetails.coursParticipants.find((cp: any) => cp.cours?.id === ueId)
    if (!participant?.cours?.ecues) return []
    return participant.cours.ecues.map((ecue: any) => ({
      code: ecue.code,
      libelle: ecue.libelle,
      creditEcts: ecue.creditEcts,
      type: ecue.type
    }))
  }
}
