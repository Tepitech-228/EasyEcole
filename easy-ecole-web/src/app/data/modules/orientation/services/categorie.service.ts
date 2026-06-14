import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatierePrerequis } from '../models/MatierePrerequis.model';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/categories`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<MatierePrerequis[]> {
    return this.httpClient.get<MatierePrerequis[]>(`${this.SERVICE_URL}`)
  }
}
