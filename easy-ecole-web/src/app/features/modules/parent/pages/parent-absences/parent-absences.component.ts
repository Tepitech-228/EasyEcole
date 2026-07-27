import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ParentService, Enfant, AbsenceData } from '../../services/parent.service';

@Component({
  selector: 'app-parent-absences',
  templateUrl: './parent-absences.component.html',
  styleUrls: ['./parent-absences.component.scss']
})
export class ParentAbsencesComponent implements OnInit {
  enfants: Enfant[] = [];
  selectedEnfant: Enfant | null = null;
  absences: AbsenceData[] = [];
  loading = false;

  constructor(
    private parentService: ParentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.parentService.getEnfants().subscribe({
      next: (enfants) => {
        this.enfants = enfants;
        const apprenantId = Number(this.route.snapshot.params['apprenantId']);
        this.selectedEnfant = enfants.find(e => e.apprenantId === apprenantId) || enfants[0] || null;
        if (this.selectedEnfant) this.loadAbsences();
      }
    });
  }

  onEnfantChange(): void {
    this.loadAbsences();
  }

  private loadAbsences(): void {
    if (!this.selectedEnfant) return;
    this.loading = true;
    this.parentService.getAbsences(this.selectedEnfant.apprenantId).subscribe({
      next: (absences) => {
        this.absences = absences;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  get totalAbsences(): number {
    return this.absences.filter(a => a.type === 'absence').length;
  }

  get totalRetards(): number {
    return this.absences.filter(a => a.type === 'retard').length;
  }

  get nonJustifiees(): number {
    return this.absences.filter(a => !a.justifie).length;
  }
}
