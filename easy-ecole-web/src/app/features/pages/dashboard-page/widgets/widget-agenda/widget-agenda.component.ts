import { Component, Input, OnInit } from '@angular/core';
import { SeanceService } from 'src/app/data/modules/inscription/services/seance.service';
import { PlanningEvent } from 'src/app/data/modules/inscription/models/Seance.model';

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
          new Date(a.heureDebut).getTime() - new Date(b.heureDebut).getTime()
        )
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  get heureDebut(): string {
    return this.events[0]?.heureDebut
      ? new Date(this.events[0].heureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : ''
  }
}
