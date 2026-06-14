import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OffreStage } from '../models/OffreStage.model';

@Injectable({ providedIn: 'root' })
export class OffreStageService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/offres-stage`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<OffreStage[]> {
        return this.httpClient.get<OffreStage[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<OffreStage> {
        return this.httpClient.get<OffreStage>(`${this.SERVICE_URL}/${id}`)
    }

    create(offreStage: OffreStage): Observable<OffreStage> {
        return this.httpClient.post<OffreStage>(`${this.SERVICE_URL}`, offreStage)
    }

    update(offreStage: OffreStage): Observable<OffreStage> {
        return this.httpClient.put<OffreStage>(`${this.SERVICE_URL}/${offreStage.id!}`, offreStage)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
