import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Maintenance } from '../models/Maintenance.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/maintenances`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Maintenance[]> { return this.httpClient.get<Maintenance[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Maintenance> { return this.httpClient.get<Maintenance>(`${this.SERVICE_URL}/${id}`) }
    create(item: Maintenance): Observable<Maintenance> { return this.httpClient.post<Maintenance>(`${this.SERVICE_URL}`, item) }
    update(item: Maintenance): Observable<Maintenance> { return this.httpClient.put<Maintenance>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
