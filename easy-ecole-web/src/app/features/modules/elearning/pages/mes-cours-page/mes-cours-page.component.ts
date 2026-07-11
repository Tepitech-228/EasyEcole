import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-mes-cours-page',
  templateUrl: './mes-cours-page.component.html',
  styleUrls: ['./mes-cours-page.component.scss']
})
export class MesCoursPageComponent extends BaseComponentClass implements OnInit {
  coursList: any[] = [];
  filteredList: any[] = [];
  loading = false;
  searchQuery = '';

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/cours`).subscribe({
      next: (data: any) => {
        this.coursList = data;
        this.filteredList = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  filterCours(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredList = this.coursList;
      return;
    }
    this.filteredList = this.coursList.filter(c =>
      c.titre?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }

  get totalModules(): number {
    return this.filteredList.reduce((sum, c) => sum + (c.modules?.length || 0), 0);
  }
}
