import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Enseignant } from '../models/Enseignant.model';

@Injectable({
  providedIn: 'root'
})
export class EnseignantService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/enseignants`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Enseignant[]> {
    return this.httpClient.get<Enseignant[]>(`${this.SERVICE_URL}`)
  }

  get(id?: string): Observable<Enseignant> {
    return this.httpClient.get<Enseignant>(`${this.SERVICE_URL}/${id}`)
  }

  update(enseignant: Enseignant): Observable<Enseignant> {
    return this.httpClient.put<Enseignant>(`${this.SERVICE_URL}/`, enseignant)
  }

  updatePhoto(photo: File): Observable<Enseignant> {
    let formData: FormData = new FormData()
      formData.append('photo', photo, photo.name)

    return this.httpClient.put<Enseignant>(`${this.SERVICE_URL}/photo`, formData)
  }
}
