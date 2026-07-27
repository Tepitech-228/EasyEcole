import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Prestataire } from '../models/Prestataire.model';

@Injectable({ providedIn: 'root' })
export class RhPrestataireService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/prestataires`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Prestataire[]> { return this.httpClient.get<Prestataire[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Prestataire> { return this.httpClient.get<Prestataire>(`${this.SERVICE_URL}/${id}`) }
    create(item: Prestataire): Observable<Prestataire> { return this.httpClient.post<Prestataire>(`${this.SERVICE_URL}`, item) }
    update(item: Prestataire): Observable<Prestataire> { return this.httpClient.put<Prestataire>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
