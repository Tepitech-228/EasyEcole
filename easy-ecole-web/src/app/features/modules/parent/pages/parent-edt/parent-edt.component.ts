import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ParentService, Enfant, EdtData } from '../../services/parent.service';

@Component({
  selector: 'app-parent-edt',
  templateUrl: './parent-edt.component.html',
  styleUrls: ['./parent-edt.component.scss']
})
export class ParentEdtComponent implements OnInit {
  enfants: Enfant[] = [];
  selectedEnfant: Enfant | null = null;
  edt: EdtData[] = [];
  loading = false;

  readonly jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

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
        if (this.selectedEnfant) this.loadEdt();
      }
    });
  }

  onEnfantChange(): void {
    this.loadEdt();
  }

  private loadEdt(): void {
    if (!this.selectedEnfant) return;
    this.loading = true;
    this.parentService.getEmploiDuTemps(this.selectedEnfant.apprenantId).subscribe({
      next: (edt) => {
        this.edt = edt;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getCoursForJour(jour: string): EdtData[] {
    return this.edt.filter(e => e.jour.toLowerCase() === jour.toLowerCase());
  }

  get heureDebut(): string[] {
    const heures = [...new Set(this.edt.map(e => e.horaire.split(' - ')[0]))];
    return heures.sort();
  }

  isToday(jour: string): boolean {
    const joursMap: Record<string, number> = {
      'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4, 'vendredi': 5, 'samedi': 6, 'dimanche': 0
    };
    const todayIndex = new Date().getDay();
    return joursMap[jour.toLowerCase()] === todayIndex;
  }
}
