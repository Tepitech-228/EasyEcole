import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CategorieArticle } from '../models/CategorieArticle.model';

@Injectable({ providedIn: 'root' })
export class CategorieArticleService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/categories`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<CategorieArticle[]> { return this.httpClient.get<CategorieArticle[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<CategorieArticle> { return this.httpClient.get<CategorieArticle>(`${this.SERVICE_URL}/${id}`) }
    create(item: CategorieArticle): Observable<CategorieArticle> { return this.httpClient.post<CategorieArticle>(`${this.SERVICE_URL}`, item) }
    update(item: CategorieArticle): Observable<CategorieArticle> { return this.httpClient.put<CategorieArticle>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
