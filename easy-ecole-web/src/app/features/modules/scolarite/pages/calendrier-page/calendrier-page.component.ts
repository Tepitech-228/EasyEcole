import { Component, OnInit } from '@angular/core';
import { EvenementCalendrier } from 'src/app/data/modules/scolarite/models/EvenementCalendrier.model';
import { EvenementCalendrierService } from 'src/app/data/modules/scolarite/services/evenement-calendrier.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-calendrier-page',
  templateUrl: './calendrier-page.component.html',
  styleUrls: ['./calendrier-page.component.scss']
})
export class CalendrierPageComponent extends BaseComponentClass implements OnInit {
  evenements: EvenementCalendrier[] = [];
  _evenements: EvenementCalendrier[] = [];
  filterType: string = 'undefined';
  loading: boolean = false;
  addingEvent: boolean = false;
  errorMessage: string = '';
  newEvent: any = { titre: '', date: '', type: '', description: '' };

  constructor(private calendrierService: EvenementCalendrierService) {
    super();
  }

  ngOnInit(): void {
    this.loadEvenements();
  }

  get typeList(): string[] {
    return [...new Set(this.evenements.map(e => e.type))];
  }

  loadEvenements(): void {
    this.loading = true;
    this.errorMessage = '';
    this.calendrierService.getAll().subscribe({
      next: (data) => {
        this.evenements = data;
        this._evenements = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des événements';
        this.loading = false;
      }
    });
  }

  createEvent(): void {
    if (!this.newEvent.titre || !this.newEvent.date || !this.newEvent.type) return;
    this.addingEvent = true;
    this.errorMessage = '';
    this.calendrierService.create(this.newEvent as any).subscribe({
      next: () => {
        this.newEvent = { titre: '', date: '', type: '', description: '' };
        this.addingEvent = false;
        this.loadEvenements();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la création de l\'événement';
        this.addingEvent = false;
      }
    });
  }

  deleteEvent(ev: EvenementCalendrier): void {
    if (!ev.id || !confirm('Supprimer cet événement ?')) return;
    this.calendrierService.delete(ev.id).subscribe({
      next: () => this.loadEvenements(),
      error: () => this.errorMessage = 'Erreur lors de la suppression'
    });
  }

  filtrer(): void {
    this._evenements = this.evenements
      .filter(e => this.filterType === 'undefined' || e.type === this.filterType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  reinitialiserFiltres(): void {
    this.filterType = 'undefined';
    this._evenements = [...this.evenements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getColor(type: string): string {
    switch (type) {
      case 'Examen': return 'red';
      case 'Vacances': return 'blue';
      case 'Rentrée': return 'green';
      case 'Conseil': return 'orange';
      case 'Fin': return 'gray';
      default: return 'blue';
    }
  }

  getTypeCount(type: string): number {
    return this.evenements.filter(e => e.type === type).length;
  }
}
