import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AttestationStage } from '../models/AttestationStage.model';

@Injectable({ providedIn: 'root' })
export class AttestationStageService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/attestations-stage`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<AttestationStage[]> {
        return this.httpClient.get<AttestationStage[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<AttestationStage> {
        return this.httpClient.get<AttestationStage>(`${this.SERVICE_URL}/${id}`)
    }

    create(attestationStage: AttestationStage): Observable<AttestationStage> {
        return this.httpClient.post<AttestationStage>(`${this.SERVICE_URL}`, attestationStage)
    }

    update(attestationStage: AttestationStage): Observable<AttestationStage> {
        return this.httpClient.put<AttestationStage>(`${this.SERVICE_URL}/${attestationStage.id!}`, attestationStage)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
