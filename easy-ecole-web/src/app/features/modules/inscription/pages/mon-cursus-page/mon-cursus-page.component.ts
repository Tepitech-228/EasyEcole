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
  expandedUeId: string | number | null = null

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
    this.expandedUeId = null
    this.showDetailsCursusModal = true
    this.loadCoursDetails(String(cursus.id))
  }

  closeDetailsModal(): void {
    this.showDetailsCursusModal = false
    this.selectedCursus = null
    this.coursDetails = null
    this.expandedUeId = null
  }

  private loadCoursDetails(cursusId: string): void {
    this.loadingDetails = true
    this.cursusApprenantService.getCoursChoisis(cursusId).subscribe({
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

  private getCoursDuCursus(): any[] {
    if (!this.coursDetails) return []
    const coursParticipants = (this.coursDetails.coursParticipants || [])
      .map((participant: any) => participant.cours)
      .filter(Boolean)
    if (coursParticipants.length > 0) return coursParticipants

    return (this.coursDetails.coursChoisis || [])
      .map((choix: any) => choix.cours)
      .filter(Boolean)
  }

  getUeList(): any[] {
    return this.getCoursDuCursus().map((cours: any) => ({
      id: cours.id,
      code: cours.code,
      intitule: cours.intitule,
      semestre: cours.semestre,
      credit: cours.credit,
      enseignant: this.nomEnseignant(cours.enseignant)
    }))
  }

  getEcueList(ueId: number): any[] {
    const cours = this.getCoursDuCursus().find((item: any) => Number(item.id) === Number(ueId))
    if (!cours?.ecues) return []
    return cours.ecues.map((ecue: any) => ({
      code: ecue.code,
      libelle: ecue.libelle,
      creditEcts: ecue.creditEcts,
      coefficient: ecue.coefficient,
      cmHoraire: ecue.cmHoraire,
      tdTpHoraire: ecue.tdTpHoraire,
      tpeHoraire: ecue.tpeHoraire,
      type: ecue.type,
      enseignant: this.nomEnseignant(ecue.enseignant)
    }))
  }

  toggleUe(ueId: string | number): void {
    this.expandedUeId = this.expandedUeId === ueId ? null : ueId
  }

  private nomEnseignant(enseignant: any): string {
    const utilisateur = enseignant?.utilisateur
    return utilisateur
      ? `${utilisateur.nom || ''} ${utilisateur.prenoms || ''}`.trim() || '—'
      : 'Non assigné'
  }
}
