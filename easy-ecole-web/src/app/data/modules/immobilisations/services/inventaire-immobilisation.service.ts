import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { InventaireImmobilisation } from '../models/InventaireImmobilisation.model';

@Injectable({ providedIn: 'root' })
export class InventaireImmobilisationService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.IMMOBILISATIONS}/inventaires`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<InventaireImmobilisation[]> { return this.httpClient.get<InventaireImmobilisation[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<InventaireImmobilisation> { return this.httpClient.get<InventaireImmobilisation>(`${this.SERVICE_URL}/${id}`) }
    create(item: InventaireImmobilisation): Observable<InventaireImmobilisation> { return this.httpClient.post<InventaireImmobilisation>(`${this.SERVICE_URL}`, item) }
    update(item: InventaireImmobilisation): Observable<InventaireImmobilisation> { return this.httpClient.put<InventaireImmobilisation>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
