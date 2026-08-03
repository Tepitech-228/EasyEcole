import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PrestationEnseignant } from '../models/PrestationEnseignant.model';

@Injectable({ providedIn: 'root' })
export class RhPrestationEnseignantService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/prestations-enseignant`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<PrestationEnseignant[]> { return this.httpClient.get<PrestationEnseignant[]>(this.SERVICE_URL) }

    create(item: PrestationEnseignant): Observable<PrestationEnseignant> { return this.httpClient.post<PrestationEnseignant>(this.SERVICE_URL, item) }

    valider(id: string): Observable<PrestationEnseignant> { return this.httpClient.patch<PrestationEnseignant>(`${this.SERVICE_URL}/${id}/valider`, {}) }

    payer(id: string): Observable<any> { return this.httpClient.patch<any>(`${this.SERVICE_URL}/${id}/payer`, {}) }
}