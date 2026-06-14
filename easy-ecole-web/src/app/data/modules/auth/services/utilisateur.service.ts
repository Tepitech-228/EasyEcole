import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Utilisateur } from '../models/Utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/utilisateurs`

  constructor(private httpClient: HttpClient) { }

  get(id?: string): Observable<Utilisateur> {
    return this.httpClient.get<Utilisateur>(`${this.SERVICE_URL}/${id}`)
  }

  update(utilisateur: Utilisateur): Observable<Utilisateur> {
    return this.httpClient.put<Utilisateur>(`${this.SERVICE_URL}/`, utilisateur)
  } 
}
