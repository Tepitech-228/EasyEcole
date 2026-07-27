import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ParentService, Enfant, NoteData } from '../../services/parent.service';

@Component({
  selector: 'app-parent-notes',
  templateUrl: './parent-notes.component.html',
  styleUrls: ['./parent-notes.component.scss']
})
export class ParentNotesComponent implements OnInit {
  enfants: Enfant[] = [];
  selectedEnfant: Enfant | null = null;
  notes: NoteData[] = [];
  filteredNotes: NoteData[] = [];
  loading = false;
  selectedSemestre: string = 'Tous';
  semestres: string[] = [];

  constructor(
    private parentService: ParentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadEnfants();
  }

  private loadEnfants(): void {
    this.parentService.getEnfants().subscribe({
      next: (enfants) => {
        this.enfants = enfants;
        const apprenantId = Number(this.route.snapshot.params['apprenantId']);
        this.selectedEnfant = enfants.find(e => e.apprenantId === apprenantId) || enfants[0] || null;
        if (this.selectedEnfant) this.loadNotes();
      }
    });
  }

  onEnfantChange(): void {
    this.loadNotes();
  }

  private loadNotes(): void {
    if (!this.selectedEnfant) return;
    this.loading = true;
    this.parentService.getNotes(this.selectedEnfant.apprenantId).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.semestres = ['Tous', ...new Set(notes.map(n => n.semestre))];
        this.selectedSemestre = 'Tous';
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSemestreChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredNotes = this.selectedSemestre === 'Tous'
      ? [...this.notes]
      : this.notes.filter(n => n.semestre === this.selectedSemestre);
  }

  get moyenne(): number {
    if (this.filteredNotes.length === 0) return 0;
    const total = this.filteredNotes.reduce((sum, n) => sum + n.note * n.coefficient, 0);
    const coefs = this.filteredNotes.reduce((sum, n) => sum + n.coefficient, 0);
    return coefs > 0 ? Math.round((total / coefs) * 100) / 100 : 0;
  }
}
