import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {
  coursId: string | null = null;
  salons: any[] = [];
  selectedSalon: any = null;
  loading = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.coursId = this.route.snapshot.paramMap.get('id');
    this.loadSalons();
  }

  loadSalons(): void {
    this.loading = true;
    this.http.get(`${environment.API_URL}/elearning/chat/salons`).subscribe({
      next: (data: any) => {
        this.salons = data.filter((s: any) => !this.coursId || s.coursId == this.coursId);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  selectSalon(salon: any): void {
    this.selectedSalon = salon;
  }
}

