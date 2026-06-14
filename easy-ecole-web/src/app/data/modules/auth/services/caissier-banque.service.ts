import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CaissierBanque } from '../models/CaissierBanque.model';

@Injectable({
  providedIn: 'root'
})
export class CaissierBanqueService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/caissiersBanque`

  constructor(private httpClient: HttpClient) { }

  get(id?: string): Observable<CaissierBanque> {
    return this.httpClient.get<CaissierBanque>(`${this.SERVICE_URL}/${id}`)
  }

  update(caissierBanque: CaissierBanque): Observable<CaissierBanque> {
    return this.httpClient.put<CaissierBanque>(`${this.SERVICE_URL}/`, caissierBanque)
  }
}
