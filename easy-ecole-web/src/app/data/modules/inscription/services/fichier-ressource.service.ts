import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FichierRessource } from '../models/FichierRessource.model';

@Injectable({
  providedIn: 'root'
})
export class FichierRessourceService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/fichiersRessource`

  constructor(private httpClient: HttpClient) { }

  get(id: string): Observable<FichierRessource> {
    return this.httpClient.get<FichierRessource>(`${this.SERVICE_URL}/${id}`)
  }

  download(id: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/download`, { responseType: 'blob', observe: 'response' })
  }

  create(fichierRessource: FichierRessource, fichier: File | undefined = undefined): Observable<HttpEvent<any>> {
    let formData = new FormData()
    if (fichierRessource.titre) {
      formData.append('titre', fichierRessource.titre)
    }

    if (fichierRessource.description) {
      formData.append('description', fichierRessource.description)
    }

    if (fichier != undefined) {
      if(fichier)
        formData.append('fichier', fichier, fichier.name)
    }
    else if(fichierRessource.fichier) {
      formData.append('fichier', fichierRessource.fichier)
    }
    
    if (fichierRessource.ressourceId) {
      formData.append('ressourceId', fichierRessource.ressourceId)
    }

    const httpRequest = new HttpRequest('POST', `${this.SERVICE_URL}`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.httpClient.request<HttpEvent<any>>(httpRequest)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }
}
