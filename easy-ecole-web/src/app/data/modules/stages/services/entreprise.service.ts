import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Entreprise } from '../models/Entreprise.model';

@Injectable({ providedIn: 'root' })
export class EntrepriseService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/entreprises`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<Entreprise[]> {
        return this.httpClient.get<Entreprise[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<Entreprise> {
        return this.httpClient.get<Entreprise>(`${this.SERVICE_URL}/${id}`)
    }

    create(entreprise: Entreprise): Observable<Entreprise> {
        return this.httpClient.post<Entreprise>(`${this.SERVICE_URL}`, entreprise)
    }

    update(entreprise: Entreprise): Observable<Entreprise> {
        return this.httpClient.put<Entreprise>(`${this.SERVICE_URL}/${entreprise.id!}`, entreprise)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
