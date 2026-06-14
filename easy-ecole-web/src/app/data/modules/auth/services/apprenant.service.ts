import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Apprenant } from '../models/Apprenant.model';

@Injectable({
  providedIn: 'root'
})
export class ApprenantService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/apprenants`

  constructor(private httpClient: HttpClient) { }

  get(id?: string): Observable<Apprenant> {
    return this.httpClient.get<Apprenant>(`${this.SERVICE_URL}/${id}`)
  }

  update(apprenant: Apprenant): Observable<Apprenant> {
    return this.httpClient.put<Apprenant>(`${this.SERVICE_URL}/`, apprenant)
  }

  updatePhoto(photo: File): Observable<Apprenant> {
    let formData: FormData = new FormData()
      formData.append('photo', photo, photo.name)

    return this.httpClient.put<Apprenant>(`${this.SERVICE_URL}/photo`, formData)
  }
}