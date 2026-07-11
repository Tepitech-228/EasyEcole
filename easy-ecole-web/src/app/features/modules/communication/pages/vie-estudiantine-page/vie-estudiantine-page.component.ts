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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get(`${environment.API_URL}/communication/communications`).subscribe((data: any) => {
      this.communications = data;
    });
    this.http.get(`${environment.API_URL}/communication/actualites`).subscribe((data: any) => {
      this.actualites = data;
    });
  }
}
