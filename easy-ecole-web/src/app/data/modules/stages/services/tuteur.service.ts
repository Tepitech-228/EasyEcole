import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Tuteur } from '../models/Tuteur.model';

@Injectable({ providedIn: 'root' })
export class TuteurService {

    private readonly SERVICE_URL: string = `${environment.API_MODULES.STAGES}/tuteurs`

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<Tuteur[]> {
        return this.httpClient.get<Tuteur[]>(`${this.SERVICE_URL}`)
    }

    get(id: string): Observable<Tuteur> {
        return this.httpClient.get<Tuteur>(`${this.SERVICE_URL}/${id}`)
    }

    create(tuteur: Tuteur): Observable<Tuteur> {
        return this.httpClient.post<Tuteur>(`${this.SERVICE_URL}`, tuteur)
    }

    update(tuteur: Tuteur): Observable<Tuteur> {
        return this.httpClient.put<Tuteur>(`${this.SERVICE_URL}/${tuteur.id!}`, tuteur)
    }

    delete(id: string): Observable<any> {
        return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
    }
}
