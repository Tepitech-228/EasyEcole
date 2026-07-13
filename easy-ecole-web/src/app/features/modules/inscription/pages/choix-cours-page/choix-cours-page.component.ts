import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionCours } from 'src/app/data/modules/inscription/models/DemandeInscriptionCours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';

@Component({
  selector: 'app-choix-cours-page',
  templateUrl: './choix-cours-page.component.html',
  styleUrls: ['./choix-cours-page.component.scss']
})
export class ChoixCoursPageComponent implements OnInit {

  id: string
  demandeInscription?: DemandeInscription
  tousLesCours: Cours[] = []
  coursFacultatifs: Cours[] = []
  choixCours: { [id: string]: boolean } = {}

  constructor(
    private coursService: CoursService,
    private demandeInscriptionService: DemandeInscriptionService,
    private activatedRoute: ActivatedRoute,
    private router: Router) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id') as string
  }

  ngOnInit(): void {
    this.loadDemande()
  }

  private loadDemande(): void {
    this.demandeInscriptionService.get(this.id).subscribe({
      next: (res) => {
        this.demandeInscription = res
        this.loadCours()
      },
      error: (err: HttpErrorResponse) => {
        console.log(err)
        if (err.status == 404) {
          this.router.navigate(['/inscription/demandes'])
        }
      }
    })
  }

  private loadCours(): void {
    const parcoursFinal = this.demandeInscription!.parcoursChoisis?.find(p => p.choixFinal)?.parcours
      ?? this.demandeInscription!.parcoursChoisis?.[0]?.parcours

    if (!parcoursFinal) {
      return
    }

    this.coursService.getAll(parcoursFinal.id).subscribe({
      next: (cours) => {
        this.tousLesCours = cours
        this.coursFacultatifs = cours.filter(c => !c.estObligatoire)
        this.coursFacultatifs.forEach(c => {
          this.choixCours[c.id!] = false
        })
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  get selectedCount(): number {
    return Object.values(this.choixCours).filter(v => v).length
  }

  valider(): void {
    const obligatoiresIds = this.tousLesCours
      .filter(c => c.estObligatoire)
      .map(c => c.id!)

    const facultatifsChoisisIds = Object.keys(this.choixCours).filter(k => this.choixCours[k])
    const aSauvegarder = [...obligatoiresIds, ...facultatifsChoisisIds]

    if (aSauvegarder.length === 0) {
      this.router.navigate(['/inscription/demandes/' + this.id])
      return
    }

    let completed = 0
    for (const coursId of aSauvegarder) {
      const demandeInscriptionCours = new DemandeInscriptionCours()
      demandeInscriptionCours.coursId = coursId
      this.demandeInscriptionService.createCours(this.id, demandeInscriptionCours).subscribe({
        next: () => {
          completed++
          if (completed >= aSauvegarder.length) {
            this.router.navigate(['/inscription/demandes/' + this.id])
          }
        },
        error: (err) => {
          console.log(err)
          completed++
          if (completed >= aSauvegarder.length) {
            this.router.navigate(['/inscription/demandes/' + this.id])
          }
        }
      })
    }
  }

  retour(): void {
    this.router.navigate(['/inscription/demandes/' + this.id])
  }

}
