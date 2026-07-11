import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

export interface MenuGroup {
  label: string;
  icon?: string;
  items: MenuItem[];
}

export interface MenuPole {
  label: string;
  icon: string;
  groups: MenuGroup[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  constructor(private http: HttpClient) {}

  getMenu(): Observable<MenuPole[]> {
    return this.http.get<MenuPole[]>(`${environment.API_URL}/menu`).pipe(
      catchError(() => of([]))
    );
  }
}
