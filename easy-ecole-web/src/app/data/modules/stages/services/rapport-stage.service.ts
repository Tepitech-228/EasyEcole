import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RapportStage } from '../models/RapportStage.model';

@Injectable({ providedIn: 'root' })
export class RapportStageService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/rapports-stage`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<RapportStage[]> {
        return this.httpClient.get<RapportStage[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<RapportStage> {
        return this.httpClient.get<RapportStage>(`${this.SERVICE_URL}/${id}`)
    }

    create(rapportStage: RapportStage): Observable<RapportStage> {
        return this.httpClient.post<RapportStage>(`${this.SERVICE_URL}`, rapportStage)
    }

    update(rapportStage: RapportStage): Observable<RapportStage> {
        return this.httpClient.put<RapportStage>(`${this.SERVICE_URL}/${rapportStage.id!}`, rapportStage)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
