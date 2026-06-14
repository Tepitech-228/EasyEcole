import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DemandeStage } from '../models/DemandeStage.model';

@Injectable({ providedIn: 'root' })
export class DemandeStageService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/demandes-stage`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<DemandeStage[]> {
        return this.httpClient.get<DemandeStage[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<DemandeStage> {
        return this.httpClient.get<DemandeStage>(`${this.SERVICE_URL}/${id}`)
    }

    create(demandeStage: DemandeStage): Observable<DemandeStage> {
        return this.httpClient.post<DemandeStage>(`${this.SERVICE_URL}`, demandeStage)
    }

    update(demandeStage: DemandeStage): Observable<DemandeStage> {
        return this.httpClient.put<DemandeStage>(`${this.SERVICE_URL}/${demandeStage.id!}`, demandeStage)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
