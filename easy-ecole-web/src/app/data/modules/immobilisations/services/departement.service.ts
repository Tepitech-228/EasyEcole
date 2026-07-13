import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Departement } from '../models/Departement.model';

@Injectable({ providedIn: 'root' })
export class DepartementService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/departements`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Departement[]> { return this.httpClient.get<Departement[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Departement> { return this.httpClient.get<Departement>(`${this.SERVICE_URL}/${id}`) }
    create(item: Departement): Observable<Departement> { return this.httpClient.post<Departement>(`${this.SERVICE_URL}`, item) }
    update(item: Departement): Observable<Departement> { return this.httpClient.put<Departement>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
