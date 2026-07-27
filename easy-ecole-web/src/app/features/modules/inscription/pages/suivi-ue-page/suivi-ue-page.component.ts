import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SuiviUeService, SuiviUeResult, UeStats, SemestreProgression, AnneeParcoursInfo } from 'src/app/data/modules/inscription/services/suivi-ue.service';

@Component({
  selector: 'app-suivi-ue-page',
  templateUrl: './suivi-ue-page.component.html',
  styleUrls: ['./suivi-ue-page.component.scss']
})
export class SuiviUePageComponent extends BaseComponentClass implements OnInit {

  data: SuiviUeResult | null = null
  loading: boolean = false
  error: string | null = null
  filtreSemestre: string = 'tous'
  filtreStatut: string = 'tous'
  anneeActive: string = 'toutes'

  get anneesDisponibles(): AnneeParcoursInfo[] {
    return this.data?.progression?.annees || []
  }

  get semestresProgression(): SemestreProgression[] {
    return this.data?.progression?.semestres || []
  }

  get semestres(): string[] {
    if (!this.data) return []
    const set = new Set(this.data.ues.map(u => u.semestre))
    return Array.from(set).sort()
  }

  get semestresAnneeActive(): string[] {
    if (this.anneeActive === 'toutes' || !this.data?.progression) return this.semestres
    const annee = this.data.progression.annees.find(a => a.annee === this.anneeActive)
    return annee?.semestres || this.semestres
  }

  get statuts(): string[] {
    return ['validee', 'dette_active', 'resorbee', 'echeance', 'en_cours', 'non_entamee']
  }

  get uesFiltrees(): UeStats[] {
    if (!this.data) return []
    return this.data.ues.filter(u => {
      if (this.filtreSemestre !== 'tous' && u.semestre !== this.filtreSemestre) return false
      if (this.filtreStatut !== 'tous' && u.statut !== this.filtreStatut) return false
      if (this.anneeActive !== 'toutes') {
        const annee = this.data!.progression?.annees.find(a => a.semestres.includes(u.semestre))
        if (!annee || annee.annee !== this.anneeActive) return false
      }
      return true
    })
  }

  get progressionPourcentage(): number {
    if (!this.data) return 0
    return this.data.stats.tauxValidation
  }

  getSemestreLabel(sem: string): string {
    const labels: Record<string, string> = {
      semestre1: 'Semestre 1', semestre2: 'Semestre 2',
      semestre3: 'Semestre 3', semestre4: 'Semestre 4',
      semestre5: 'Semestre 5', semestre6: 'Semestre 6'
    }
    return labels[sem] || sem
  }

  getSemestreProgression(sem: string): SemestreProgression | undefined {
    return this.semestresProgression.find(s => s.semestre === sem)
  }

  getStatutProgressionLabel(statut: string): string {
    const labels: Record<string, string> = {
      non_entame: 'Non entamé', en_cours: 'En cours',
      termine: 'Terminé', bloque: 'Bloqué'
    }
    return labels[statut] || statut
  }

  constructor(
    private suiviUeService: SuiviUeService,
    private router: Router
  ) {
    super()
  }

  ngOnInit(): void {
    this.chargerSuivi()
  }

  chargerSuivi(): void {
    this.loading = true
    this.error = null

    if (this.rolesValue.isApprenant) {
      this.suiviUeService.getMonSuivi().subscribe({
        next: (res) => {
          this.data = res
          this.loading = false
        },
        error: (err) => {
          this.error = "Erreur lors du chargement de votre suivi pédagogique"
          this.loading = false
          console.error(err)
        }
      })
    } else {
      this.suiviUeService.getMonSuivi().subscribe({
        next: (res) => {
          this.data = res
          this.loading = false
        },
        error: (err) => {
          this.error = "Erreur lors du chargement du suivi"
          this.loading = false
          console.error(err)
        }
      })
    }
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      validee: 'Validée',
      dette_active: 'Dette active',
      resorbee: 'Résorbée',
      echeance: 'Échue',
      en_cours: 'En cours',
      non_entamee: 'Non entamée'
    }
    return labels[statut] || statut
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      validee: 'bg-green-100 text-green-800',
      dette_active: 'bg-red-100 text-red-800',
      resorbee: 'bg-blue-100 text-blue-800',
      echeance: 'bg-gray-100 text-gray-800',
      en_cours: 'bg-yellow-100 text-yellow-800',
      non_entamee: 'bg-gray-50 text-gray-400'
    }
    return classes[statut] || 'bg-gray-100 text-gray-800'
  }

  getMoyenneClass(moyenne: number | null): string {
    if (moyenne == null) return ''
    return moyenne >= 10 ? 'text-green-600' : 'text-red-600'
  }
}
