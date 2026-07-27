import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-parametres-validateurs-page',
  templateUrl: './parametres-validateurs-page.component.html',
  styleUrls: ['./parametres-validateurs-page.component.scss']
})
export class ParametresValidateursPageComponent extends BaseComponentClass implements OnInit {
  validateurs: any[] = []
  loading = false

  constructor() { super() }

  ngOnInit(): void {
    this.loadValidateurs()
  }

  loadValidateurs() {
    this.loading = true
    setTimeout(() => {
      this.validateurs = [
        { id: 1, utilisateur: 'M. Dupont', niveau: 'Niveau 1', montantMax: 500000, actif: true },
        { id: 2, utilisateur: 'Mme Martin', niveau: 'Niveau 2', montantMax: 1500000, actif: true },
        { id: 3, utilisateur: 'M. Bernard', niveau: 'Niveau 3', montantMax: 5000000, actif: false },
      ]
      this.loading = false
    }, 500)
  }

  getStatutBadge(actif: boolean): string {
    return actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }
}
