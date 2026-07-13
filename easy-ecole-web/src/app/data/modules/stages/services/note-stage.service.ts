import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NoteStage } from '../models/NoteStage.model';

@Injectable({ providedIn: 'root' })
export class NoteStageService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/notes-stage`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<NoteStage[]> {
        return this.httpClient.get<NoteStage[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<NoteStage> {
        return this.httpClient.get<NoteStage>(`${this.SERVICE_URL}/${id}`)
    }

    create(noteStage: NoteStage): Observable<NoteStage> {
        return this.httpClient.post<NoteStage>(`${this.SERVICE_URL}`, noteStage)
    }

    update(noteStage: NoteStage): Observable<NoteStage> {
        return this.httpClient.put<NoteStage>(`${this.SERVICE_URL}/${noteStage.id!}`, noteStage)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
