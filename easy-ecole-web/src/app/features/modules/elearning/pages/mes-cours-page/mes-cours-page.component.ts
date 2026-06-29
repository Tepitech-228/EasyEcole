import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-mes-cours-page',
  templateUrl: './mes-cours-page.component.html'
})
export class MesCoursPageComponent implements OnInit {
  coursList: any[] = [];
  loading = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/cours`).subscribe({
      next: (data: any) => {
        this.coursList = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}

