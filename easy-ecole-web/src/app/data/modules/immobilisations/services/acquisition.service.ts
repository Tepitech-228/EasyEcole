import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Acquisition } from '../models/Acquisition.model';

@Injectable({ providedIn: 'root' })
export class AcquisitionService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/acquisitions`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Acquisition[]> { return this.httpClient.get<Acquisition[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Acquisition> { return this.httpClient.get<Acquisition>(`${this.SERVICE_URL}/${id}`) }
    create(item: Acquisition): Observable<Acquisition> { return this.httpClient.post<Acquisition>(`${this.SERVICE_URL}`, item) }
    update(item: Acquisition): Observable<Acquisition> { return this.httpClient.put<Acquisition>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
