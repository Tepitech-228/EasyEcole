import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ReponseInscription } from '../models/ReponseInscription.model';

@Injectable({
  providedIn: 'root'
})
export class ReponseInscriptionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/reponsesInscription`

  constructor(private httpClient: HttpClient) { }

  create(reponseInscription: ReponseInscription): Observable<ReponseInscription> {
    return this.httpClient.post<ReponseInscription>(`${this.SERVICE_URL}`, reponseInscription)
  }
}
