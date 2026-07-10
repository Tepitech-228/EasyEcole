import { Component, OnInit } from '@angular/core';
import { PlanningPersonnelService, PlanningPersonnel } from 'src/app/data/modules/rh/services/planning-personnel.service';

@Component({
  selector: 'app-widget-planning-personnel',
  templateUrl: './widget-planning-personnel.component.html',
  styleUrls: ['./widget-planning-personnel.component.scss']
})
export class WidgetPlanningPersonnelComponent implements OnInit {
  entries: PlanningPersonnel[] = []
  loading: boolean = true

  private readonly DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  constructor(private planningPersonnelService: PlanningPersonnelService) {}

  ngOnInit(): void {
    this.planningPersonnelService.getPersonnelPlanning().subscribe({
      next: (data) => {
        const todayName = this.DAYS[new Date().getDay()]
        this.entries = (data || []).filter(e => e.jourSemaine === todayName).slice(0, 5)
        this.loading = false
      },
      error: () => this.loading = false
    })
  }
}
