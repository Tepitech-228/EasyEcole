import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-cours-details-page',
  templateUrl: './cours-details-page.component.html',
  styleUrls: ['./cours-details-page.component.scss']
})
export class CoursDetailsPageComponent extends BaseComponentClass implements OnInit {
  cours: any = null;
  loading = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private sanitizer: DomSanitizer) { super(); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading = true;
      this.http.get(`${environment.API_URL}/elearning/cours/${id}`).subscribe({
        next: (data: any) => {
          this.cours = data;
          this.loading = false;
        },
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

  safeUrl(path: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(path);
  }

  get isInstitution(): boolean {
    return this.rolesValue.isInstitution;
  }

  get isEnseignant(): boolean {
    return this.rolesValue.isEnseignant;
  }
}
