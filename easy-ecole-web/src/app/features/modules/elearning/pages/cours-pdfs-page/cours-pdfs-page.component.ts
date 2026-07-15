import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cours-pdfs-page',
  templateUrl: './cours-pdfs-page.component.html',
  styleUrls: ['./cours-pdfs-page.component.scss']
})
export class CoursPdfsPageComponent implements OnInit {
  coursList: any[] = [];
  filteredList: any[] = [];
  loading = false;
  searchQuery = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/cours?format=pdf`).subscribe({
      next: (data: any) => { this.coursList = data; this.filteredList = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  filterCours(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) { this.filteredList = this.coursList; return; }
    this.filteredList = this.coursList.filter(c =>
      c.titre?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }

  get totalModules(): number {
    return this.filteredList.reduce((sum, c) => sum + (c.modules?.length || 0), 0);
  }
}
