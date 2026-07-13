import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-gestion-communications-page',
  templateUrl: './gestion-communications-page.component.html',
  styleUrls: ['./gestion-communications-page.component.scss']
})
export class GestionCommunicationsPageComponent implements OnInit {
  communications: any[] = [];
  newComm: any = { titre: '', contenu: '', statut: 'brouillon' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCommunications();
  }

  loadCommunications() {
    this.http.get(`${environment.API_URL}/communication/communications`).subscribe((data: any) => {
      this.communications = data;
    });
  }

  createCommunication() {
    this.http.post(`${environment.API_URL}/communication/communications`, this.newComm).subscribe(() => {
      this.newComm = { titre: '', contenu: '', statut: 'brouillon' };
      this.loadCommunications();
    });
  }

  deleteCommunication(id: number) {
    this.http.delete(`${environment.API_URL}/communication/communications/${id}`).subscribe(() => {
      this.loadCommunications();
    });
  }
}
