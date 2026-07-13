import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-vie-estudiantine-page',
  templateUrl: './vie-estudiantine-page.component.html',
  styleUrls: ['./vie-estudiantine-page.component.scss']
})
export class VieEstudiantinePageComponent implements OnInit {
  communications: any[] = [];
  actualites: any[] = [];
  selectedCategorie: string = '';

  evenements: any[] = [
    { id: 1, titre: 'Journée Portes Ouvertes', date: '2026-09-15T09:00:00', lieu: 'Campus Principal', description: 'Venez découvrir nos formations et rencontrer nos équipes pédagogiques.', couleur: 'blue' },
    { id: 2, titre: 'Tournoi Inter-Classes', date: '2026-09-28T14:00:00', lieu: 'Gymnase', description: 'Tournoi de basketball et football entre les classes.', couleur: 'green' },
    { id: 3, titre: 'Conférence Innovation', date: '2026-10-05T10:00:00', lieu: 'Amphithéâtre A', description: 'Conférence sur les métiers du futur avec des intervenants de renom.', couleur: 'purple' },
    { id: 4, titre: 'Soirée Culturelle', date: '2026-10-20T18:00:00', lieu: 'Salle Polyvalente', description: 'Spectacles, danses et musiques traditionnelles.', couleur: 'orange' }
  ];

  associations: any[] = [
    { id: 1, nom: 'Club Informatique', description: 'Ateliers de programmation, hackathons et projets collaboratifs.', membres: 45, icone: '💻' },
    { id: 2, nom: 'Association Sportive', description: 'Entraînements et compétitions dans toutes les disciplines.', membres: 120, icone: '⚽' },
    { id: 3, nom: 'Club Artistique', description: 'Théâtre, musique, peinture et arts plastiques.', membres: 30, icone: '🎨' },
    { id: 4, nom: 'Bureau des Étudiants', description: 'Organisation des événements et représentation des étudiants.', membres: 15, icone: '🎓' },
    { id: 5, nom: 'Club Environnement', description: 'Actions écologiques et sensibilisation au développement durable.', membres: 25, icone: '🌱' },
    { id: 6, nom: 'Club Robotique', description: 'Construction et programmation de robots pour compétitions.', membres: 20, icone: '🤖' }
  ];

  get categories(): string[] {
    const cats = this.actualites.map(a => a.categorie).filter(Boolean);
    return [...new Set(cats)] as string[];
  }

  get filteredActualites(): any[] {
    if (!this.selectedCategorie) return this.actualites;
    return this.actualites.filter(a => a.categorie === this.selectedCategorie);
  }

  get filteredCommunications(): any[] {
    if (!this.selectedCategorie) return this.communications;
    return this.communications.filter((c: any) => c.categorie === this.selectedCategorie);
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(`${environment.API_URL}/communication/communications`).subscribe((data: any) => {
      this.communications = data;
    });
    this.http.get(`${environment.API_URL}/communication/actualites`).subscribe((data: any) => {
      this.actualites = data;
    });
  }

  getBadgeColor(couleur: string): string {
    const map: any = { blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700', purple: 'bg-purple-100 text-purple-700', orange: 'bg-orange-100 text-orange-700' };
    return map[couleur] || 'bg-slate-100 text-slate-700';
  }
}
