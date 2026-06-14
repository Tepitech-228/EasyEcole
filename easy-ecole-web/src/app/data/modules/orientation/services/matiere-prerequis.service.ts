import { Injectable } from '@angular/core';
import { MatierePrerequis } from '../models/MatierePrerequis.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatierePrerequisService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/matieres`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<MatierePrerequis[]> {
    return this.httpClient.get<MatierePrerequis[]>(`${this.SERVICE_URL}`)
  }
}
