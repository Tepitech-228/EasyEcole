import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cours-details-page',
  templateUrl: './cours-details-page.component.html'
})
export class CoursDetailsPageComponent implements OnInit {
  cours: any = null;
  loading = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading = true;
      this.http.get(`${environment.apiUrl}/elearning/cours/${id}`).subscribe({
        next: (data: any) => {
          this.cours = data;
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }
  }
}
