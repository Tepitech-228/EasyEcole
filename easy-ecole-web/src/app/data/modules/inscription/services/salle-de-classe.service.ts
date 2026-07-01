import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SalleDeClasse } from '../models/SalleDeClasse.model';

@Injectable({
  providedIn: 'root'
})
export class SalleDeClasseService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.INSCRIPTION}/sallesDeClasse`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<SalleDeClasse[]> {
    return this.httpClient.get<SalleDeClasse[]>(`${this.SERVICE_URL}`)
  }
}
