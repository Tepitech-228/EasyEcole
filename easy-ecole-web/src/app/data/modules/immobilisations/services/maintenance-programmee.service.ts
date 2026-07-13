import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MaintenanceProgrammee } from '../models/MaintenanceProgrammee.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceProgrammeeService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/maintenances-programmees`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<MaintenanceProgrammee[]> { return this.httpClient.get<MaintenanceProgrammee[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<MaintenanceProgrammee> { return this.httpClient.get<MaintenanceProgrammee>(`${this.SERVICE_URL}/${id}`) }
    create(item: MaintenanceProgrammee): Observable<MaintenanceProgrammee> { return this.httpClient.post<MaintenanceProgrammee>(`${this.SERVICE_URL}`, item) }
    update(item: MaintenanceProgrammee): Observable<MaintenanceProgrammee> { return this.httpClient.put<MaintenanceProgrammee>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
