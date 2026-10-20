import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Enseignant } from '../models/Enseignant.model';

export interface PhotoEnseignantResponse {
  success: boolean;
  enrollmentQueued: boolean;
}

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

  getCount(): Observable<{ success: boolean, count: number }> {
    return this.httpClient.get<{ success: boolean, count: number }>(`${this.SERVICE_URL}/statistics/count`)
  }

  updatePhoto(photo: File): Observable<PhotoEnseignantResponse> {
    let formData: FormData = new FormData()
      formData.append('photo', photo, photo.name)

    return this.httpClient.put<PhotoEnseignantResponse>(`${this.SERVICE_URL}/photo`, formData)
  }

  /** L'institution renseigne la photo d'un prof et prépare son enrôlement facial. */
  updatePhotoById(enseignantId: string, photo: File): Observable<PhotoEnseignantResponse> {
    let formData: FormData = new FormData()
      formData.append('photo', photo, photo.name)
      formData.append('enseignantId', enseignantId)

    return this.httpClient.put<PhotoEnseignantResponse>(`${this.SERVICE_URL}/photo`, formData)
  }

  generateQrCodes(enseignantId?: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/qr-codes/generate`, { enseignantId })
  }
}
