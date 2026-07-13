import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Parcours } from '../models/Parcours.model';

@Injectable({
  providedIn: 'root'
})
export class ParcoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/parcours`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Parcours[]> {
    return this.httpClient.get<Parcours[]>(`${this.SERVICE_URL}`)
  }

  get(id: string): Observable<Parcours> {
    return this.httpClient.get<Parcours>(`${this.SERVICE_URL}/${id}`)
  }

  create(parcours: Parcours, image: File | undefined, video: File | undefined): Observable<Parcours> {
    let formData = new FormData()
    if (parcours.titre) {
      formData.append('titre', parcours.titre)
    }

    if (parcours.dureeDeFormation) {
      formData.append('dureeDeFormation', parcours.dureeDeFormation)
    }

    if (parcours.contenu) {
      formData.append('contenu', parcours.contenu)
    }

    if (parcours.categorieId) {
      formData.append('categorieId', parcours.categorieId)
    }

    if (parcours.niveauEtudeId) {
      formData.append('niveauEtudeId', parcours.niveauEtudeId)
    }

    if (image) {
      formData.append('image', image, image.name)
    }

    if (video) {
      formData.append('video', video, video.name)
    }

    return this.httpClient.post<Parcours>(`${this.SERVICE_URL}`, formData)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
