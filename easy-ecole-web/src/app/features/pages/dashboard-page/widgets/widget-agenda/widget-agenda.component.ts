import { Component, Input, OnInit } from '@angular/core';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { getPlanningEventDateTime, PlanningEvent } from 'src/app/data/modules/inscription/models/Seance.model';

@Component({
  selector: 'app-widget-agenda',
  templateUrl: './widget-agenda.component.html',
  styleUrls: ['./widget-agenda.component.scss']
})
export class WidgetAgendaComponent implements OnInit {
  @Input() enseignantId?: string
  @Input() classeId?: string

  events: PlanningEvent[] = []
  loading: boolean = true

  constructor(private seanceService: SeanceService) {}

  ngOnInit(): void {
    this.loadAgenda()
  }

  private loadAgenda(): void {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10)
    this.seanceService.getPlanning(dateStr, dateStr, this.enseignantId, this.classeId).subscribe({
      next: (data) => {
        this.events = (data || []).sort((a, b) =>
          getPlanningEventDateTime(a.date, a.heureDebut).getTime()
          - getPlanningEventDateTime(b.date, b.heureDebut).getTime()
        )
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  get heureDebut(): string {
    return this.events[0]?.heureDebut
      ? getPlanningEventDateTime(this.events[0].date, this.events[0].heureDebut)
        .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : ''
  }

  heureEvent(event: PlanningEvent, time: Date): Date {
    return getPlanningEventDateTime(event.date, time)
  }
}
