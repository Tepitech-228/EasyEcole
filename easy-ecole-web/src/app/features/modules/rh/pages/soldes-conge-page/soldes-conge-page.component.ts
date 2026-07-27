import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-soldes-conge-page',
  templateUrl: './soldes-conge-page.component.html',
  styleUrls: ['./soldes-conge-page.component.scss']
})
export class SoldesCongePageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;
  showInitForm = false;
  initData = { employeId: '', annee: new Date().getFullYear(), typeConge: 'annuel', total: 30 };
  private readonly API = `${environment.API_URL}/rh/demandes-conge`;

  constructor(private http: HttpClient) { super(); }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.http.get<any[]>(`${this.API}/soldes`).subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  ouvrirInitSolde(): void {
    this.initData = { employeId: '', annee: new Date().getFullYear(), typeConge: 'annuel', total: 30 };
    this.showInitForm = true;
  }

  initialiserSolde(): void {
    if (!this.initData.employeId || !this.initData.total) return;
    this.http.post(`${this.API}/initialiser-solde`, this.initData).subscribe({
      next: () => { this.showInitForm = false; this.load(); }
    });
  }

  getTypeConge(type?: string): string {
    const map: any = { annuel: 'Annuel', maladie: 'Maladie', exceptionnel: 'Exceptionnel' };
    return map[type || ''] || type || '';
  }
}
