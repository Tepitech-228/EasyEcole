import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ProgressionService {
  private readonly URL = `${environment.API_MODULES.ELEARNING}/progression`;
  constructor(private http: HttpClient) {}

  getProgression(): Observable<any> { return this.http.get<any>(this.URL); }
}
