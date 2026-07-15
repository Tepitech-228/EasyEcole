import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cours-details-page',
  templateUrl: './cours-details-page.component.html',
  styleUrls: ['./cours-details-page.component.scss']
})
export class CoursDetailsPageComponent implements OnInit {
  cours: any = null;
  loading = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading = true;
      this.http.get(`${environment.API_URL}/elearning/cours/${id}`).subscribe({
        next: (data: any) => { this.cours = data; this.loading = false; },
        error: () => this.loading = false
      });
    }
  }

  get modulesOrdonnes(): any[] {
    if (!this.cours?.modules) return [];
    return [...this.cours.modules].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  }

  get quizTermines(): number {
    return this.cours?.quiz?.filter((q: any) => q.reponse).length || 0;
  }

  get supportsTotal(): number {
    if (!this.cours?.modules) return 0;
    return this.cours.modules.reduce((sum: number, m: any) => sum + (m.supports?.length || 0), 0);
  }

  get isInstitution(): boolean {
    return false;
  }

  get isEnseignant(): boolean {
    return false;
  }
}
