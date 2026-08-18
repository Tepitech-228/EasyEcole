import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';

interface AnneeScolaire {
  id: string
  libelle: string
  dateDebut: string
  dateFin: string
  estCourante: boolean
  statut: string
}

@Component({
  selector: 'app-annees-scolaires-page',
  templateUrl: './annees-scolaires-page.component.html',
  styleUrls: ['./annees-scolaires-page.component.scss']
})
export class AnneesScolairesPageComponent extends BaseComponentClass implements OnInit {
  anneesScolaires: AnneeScolaire[] = []
  loading: boolean = false

  constructor(private anneeAcademiqueService: AnneeAcademiqueService) { super() }

  ngOnInit(): void {
    this.chargerAnneesScolaires()
  }

  chargerAnneesScolaires(): void {
    this.loading = true
    this.anneeAcademiqueService.getAll().subscribe({
      next: (annees: AnneeAcademique[]) => {
        // L'API n'expose que libelle + description (pas de dates ni de notion
        // "année courante" : AnneeAcademiqueController). On mappe donc les
        // colonnes absentes avec des valeurs neutres.
        this.anneesScolaires = annees.map(a => ({
          id: a.id ?? '',
          libelle: a.libelle ?? '',
          dateDebut: '',
          dateFin: '',
          estCourante: false,
          statut: 'Non définie',
        }))
        this.loading = false
      },
      error: () => {
        this.anneesScolaires = []
        this.loading = false
      }
    })
  }
}
