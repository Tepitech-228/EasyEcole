import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BulletinPaie } from '../models/BulletinPaie.model';

@Injectable({ providedIn: 'root' })
export class RhBulletinPaieService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/bulletins-paie`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<BulletinPaie[]> { return this.httpClient.get<BulletinPaie[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<BulletinPaie> { return this.httpClient.get<BulletinPaie>(`${this.SERVICE_URL}/${id}`) }
    valider(id: string): Observable<BulletinPaie> { return this.httpClient.patch<BulletinPaie>(`${this.SERVICE_URL}/${id}/valider`, {}) }
    verser(id: string): Observable<BulletinPaie> { return this.httpClient.patch<BulletinPaie>(`${this.SERVICE_URL}/${id}/verser`, {}) }
    getByPeriode(periodeId: string): Observable<BulletinPaie[]> { return this.httpClient.get<BulletinPaie[]>(`${this.SERVICE_URL}?periodeId=${periodeId}`) }
}
