import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ConventionStage } from '../models/ConventionStage.model';

@Injectable({ providedIn: 'root' })
export class ConventionStageService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/conventions-stage`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<ConventionStage[]> {
        return this.httpClient.get<ConventionStage[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<ConventionStage> {
        return this.httpClient.get<ConventionStage>(`${this.SERVICE_URL}/${id}`)
    }

    create(conventionStage: ConventionStage): Observable<ConventionStage> {
        return this.httpClient.post<ConventionStage>(`${this.SERVICE_URL}`, conventionStage)
    }

    update(conventionStage: ConventionStage): Observable<ConventionStage> {
        return this.httpClient.put<ConventionStage>(`${this.SERVICE_URL}/${conventionStage.id!}`, conventionStage)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
