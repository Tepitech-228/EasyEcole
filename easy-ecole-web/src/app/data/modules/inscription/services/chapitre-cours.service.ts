import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChapitreCours } from '../models/ChapitreCours.model';

@Injectable({
  providedIn: 'root'
})
export class ChapitreCoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/chapitresCours`

  constructor(private httpClient: HttpClient) { }

  getAll(coursId?: string): Observable<ChapitreCours[]> {
    return this.httpClient.get<ChapitreCours[]>(coursId ? `${this.SERVICE_URL}?coursId=${coursId}` : `${this.SERVICE_URL}`)
  }

  get(id: string): Observable<ChapitreCours> {
    return this.httpClient.get<ChapitreCours>(`${this.SERVICE_URL}/${id}`)
  }

  create(chapitreCours: ChapitreCours, image: File | undefined): Observable<ChapitreCours> {
    let formData = new FormData()
    if (chapitreCours.titre) {
      formData.append('titre', chapitreCours.titre)
      console.log(chapitreCours, image)
    }

    if (chapitreCours.description) {
      formData.append('description', chapitreCours.description)
      console.log(chapitreCours, image)
    }

    if (chapitreCours.coursId) {
      formData.append('coursId', chapitreCours.coursId)
      console.log(chapitreCours, image)
    }

    if (image) {
      formData.append('image', image, image.name)
      console.log(chapitreCours, image)
    }

    // console.log(chapitreCours, image)

    return this.httpClient.post<ChapitreCours>(`${this.SERVICE_URL}`, formData)
  }

  update(chapitreCours: ChapitreCours, image: File | undefined): Observable<ChapitreCours> {
    let formData = new FormData()
    if (chapitreCours.titre) {
      formData.append('titre', chapitreCours.titre)
      console.log(chapitreCours, image)
    }

    if (chapitreCours.description) {
      formData.append('description', chapitreCours.description)
      console.log(chapitreCours, image)
    }

    if (chapitreCours.coursId) {
      formData.append('coursId', chapitreCours.coursId)
      console.log(chapitreCours, image)
    }

    if (image) {
      formData.append('image', image, image.name)
      console.log(chapitreCours, image)
    }

    return this.httpClient.put<ChapitreCours>(`${this.SERVICE_URL}/${chapitreCours.id!}`, formData)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
