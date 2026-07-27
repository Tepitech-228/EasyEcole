import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategorieProfessionnelle } from '../models/CategorieProfessionnelle.model';

@Injectable({ providedIn: 'root' })
export class RhCategorieProfessionnelleService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.RH}/categories-professionnelles`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<CategorieProfessionnelle[]> { return this.httpClient.get<CategorieProfessionnelle[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<CategorieProfessionnelle> { return this.httpClient.get<CategorieProfessionnelle>(`${this.SERVICE_URL}/${id}`) }
    create(item: CategorieProfessionnelle): Observable<CategorieProfessionnelle> { return this.httpClient.post<CategorieProfessionnelle>(`${this.SERVICE_URL}`, item) }
    update(item: CategorieProfessionnelle): Observable<CategorieProfessionnelle> { return this.httpClient.put<CategorieProfessionnelle>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
