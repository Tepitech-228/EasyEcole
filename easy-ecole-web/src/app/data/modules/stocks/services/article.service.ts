import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Article } from '../models/Article.model';

@Injectable({ providedIn: 'root' })
export class ArticleService {
    private readonly SERVICE_URL: string = `${environment.API_MODULES.STOCKS}/articles`
    constructor(private httpClient: HttpClient) { }
    getAll(): Observable<Article[]> { return this.httpClient.get<Article[]>(`${this.SERVICE_URL}`) }
    get(id: string): Observable<Article> { return this.httpClient.get<Article>(`${this.SERVICE_URL}/${id}`) }
    create(item: Article): Observable<Article> { return this.httpClient.post<Article>(`${this.SERVICE_URL}`, item) }
    update(item: Article): Observable<Article> { return this.httpClient.put<Article>(`${this.SERVICE_URL}/${item.id!}`, item) }
    delete(id: string): Observable<any> { return this.httpClient.delete(`${this.SERVICE_URL}/${id}`) }
}
