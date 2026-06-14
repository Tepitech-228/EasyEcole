import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ReponseOrientation } from '../models/ReponseOrientation.model';

@Injectable({
  providedIn: 'root'
})
export class ReponseOrientationService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/reponsesOrientation`

  constructor(private httpClient: HttpClient) { }

  create(reponseOrientation: ReponseOrientation): Observable<ReponseOrientation> {
    return this.httpClient.post<ReponseOrientation>(`${this.SERVICE_URL}`, reponseOrientation)
  }
}
