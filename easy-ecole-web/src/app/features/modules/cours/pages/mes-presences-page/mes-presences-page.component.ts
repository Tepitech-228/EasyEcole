import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Cours } from 'src/app/data/modules/inscription/models/Cours.model';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { Presence } from 'src/app/data/modules/inscription/models/Presence.model';
import { EtatsDePresence } from 'src/app/data/enums/EtatsDePresence';

@Component({
  selector: 'app-mes-presences-page',
  templateUrl: './mes-presences-page.component.html',
  styleUrls: ['./mes-presences-page.component.scss']
})
export class MesPresencesPageComponent extends BaseComponentClass {
  coursList: Cours[] = []
  loading: boolean = false

  constructor(
    private coursService: CoursService,
    private router: Router
  ) {
    super()
    this.loadMesPresences()
  }

  private loadMesPresences(): void {
    this.loading = true
    this.coursService.getMesPresences().subscribe({
      next: (res) => {
        this.coursList = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }

  getTotalPresences(cours: Cours): number {
    let total = 0
    for (const lp of cours.listesPresences || []) {
      total += lp.presences?.length || 0
    }
    return total
  }

  getPresentCount(presence: Presence): number {
    return (presence.presencesCoursParticipants || []).filter(p => p.etatDePresence === EtatsDePresence.PRESENT).length
  }

  getTotalCount(presence: Presence): number {
    return (presence.presencesCoursParticipants || []).length
  }

  goToPresences(cours: Cours): void {
    if (cours.listesPresences && cours.listesPresences.length > 0) {
      this.router.navigate(['/cours/presences', cours.listesPresences[0].id])
    } else {
      this.router.navigate(['/cours/presences'])
    }
  }
}
