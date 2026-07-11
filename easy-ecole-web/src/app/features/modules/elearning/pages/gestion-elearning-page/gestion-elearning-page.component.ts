import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-gestion-elearning-page',
  templateUrl: './gestion-elearning-page.component.html',
  styleUrls: ['./gestion-elearning-page.component.scss']
})
export class GestionElearningPageComponent implements OnInit {
  coursList: any[] = [];
  loading = false;
  showCreateForm = false;
  newCours = { titre: '', description: '' };

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadCours();
  }

  loadCours(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/cours`).subscribe({
      next: (data: any) => {
        this.coursList = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  createCours(): void {
    this.http.post(`${environment.API_URL}/elearning/cours`, this.newCours).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.newCours = { titre: '', description: '' };
        this.loadCours();
      },
      error: (err) => console.error(err)
    });
  }

  deleteCours(id: string): void {
    if (confirm('Supprimer ce cours ?')) {
      this.http.delete(`${environment.API_URL}/elearning/cours/${id}`).subscribe({
        next: () => this.loadCours(),
        error: (err) => console.error(err)
      });
    }
  }
}

