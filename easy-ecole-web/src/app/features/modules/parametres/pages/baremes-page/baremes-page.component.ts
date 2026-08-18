import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EchelleNoteService } from '../../../../modules/bulletins/services/echelle-note.service';

interface Bareme {
  id: string
  nom: string
  noteMin: number
  noteMax: number
  mention: string
  appreciation: string
}

@Component({
  selector: 'app-baremes-page',
  templateUrl: './baremes-page.component.html',
  styleUrls: ['./baremes-page.component.scss']
})
export class BaremesPageComponent extends BaseComponentClass implements OnInit {
  baremes: Bareme[] = []
  loading: boolean = false

  constructor(private echelleNoteService: EchelleNoteService) { super() }

  ngOnInit(): void {
    this.chargerBaremes()
  }

  chargerBaremes(): void {
    this.loading = true
    this.echelleNoteService.getAll().subscribe({
      next: (echelles: any[]) => {
        // Le modèle API (EchelleNote) n'expose pas de champ "appréciation" :
        // la colonne correspondante est laissée vide.
        this.baremes = echelles.map(e => ({
          id: String(e.id ?? ''),
          nom: e.libelle ?? '',
          noteMin: Number(e.noteMin) || 0,
          noteMax: Number(e.noteMax) || 0,
          mention: e.mention ?? '',
          appreciation: '',
        }))
        this.loading = false
      },
      error: () => {
        this.baremes = []
        this.loading = false
      }
    })
  }
}
