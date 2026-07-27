import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IndemnitePrestataire } from '../models/IndemnitePrestataire.model';

@Injectable({ providedIn: 'root' })
export class RhIndemnitePrestataireService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/indemnites-prestataires`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<IndemnitePrestataire[]> { return this.httpClient.get<IndemnitePrestataire[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<IndemnitePrestataire> { return this.httpClient.get<IndemnitePrestataire>(`${this.SERVICE_URL}/${id}`) }
    getByPrestataire(prestataireId: string): Observable<IndemnitePrestataire[]> { return this.httpClient.get<IndemnitePrestataire[]>(`${this.SERVICE_URL}/by-prestataire/${prestataireId}`) }
    create(item: IndemnitePrestataire): Observable<IndemnitePrestataire> { return this.httpClient.post<IndemnitePrestataire>(`${this.SERVICE_URL}`, item) }
    update(item: IndemnitePrestataire): Observable<IndemnitePrestataire> { return this.httpClient.put<IndemnitePrestataire>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
