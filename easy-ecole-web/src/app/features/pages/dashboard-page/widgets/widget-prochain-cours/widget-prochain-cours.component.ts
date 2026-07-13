import { Component, OnInit, OnDestroy } from '@angular/core';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { PlanningEvent } from 'src/app/data/modules/inscription/models/Seance.model';

@Component({
  selector: 'app-widget-prochain-cours',
  templateUrl: './widget-prochain-cours.component.html',
  styleUrls: ['./widget-prochain-cours.component.scss']
})
export class WidgetProchainCoursComponent implements OnInit, OnDestroy {
  nextEvent: PlanningEvent | null = null
  loading: boolean = true
  minutesAvant: number = 0
  private intervalId: any

  constructor(private seanceService: SeanceService) {}

  ngOnInit(): void {
    this.loadNextCourse()
    this.intervalId = setInterval(() => this.updateCountdown(), 60000)
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  private loadNextCourse(): void {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10)
    this.seanceService.getPlanning(dateStr, dateStr).subscribe({
      next: (data) => {
        const events = (data || []).sort((a, b) =>
          new Date(a.heureDebut).getTime() - new Date(b.heureDebut).getTime()
        )
        const now = today.getTime()
        this.nextEvent = events.find(e => new Date(e.heureDebut).getTime() > now) || null
        this.updateCountdown()
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  private updateCountdown(): void {
    if (!this.nextEvent) return
    this.minutesAvant = Math.max(0, Math.floor(
      (new Date(this.nextEvent.heureDebut).getTime() - Date.now()) / 60000
    ))
  }

  get heureDebut(): string {
    return this.nextEvent?.heureDebut
      ? new Date(this.nextEvent.heureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : ''
  }
}
