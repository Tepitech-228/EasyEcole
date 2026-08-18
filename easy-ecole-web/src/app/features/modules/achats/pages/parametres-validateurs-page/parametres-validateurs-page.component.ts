import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ValidateurService } from 'src/app/data/modules/achats/services/validateur.service';
import { Validateur, getNomUtilisateur } from 'src/app/data/modules/achats/models/achats.models';

@Component({
  selector: 'app-parametres-validateurs-page',
  templateUrl: './parametres-validateurs-page.component.html',
  styleUrls: ['./parametres-validateurs-page.component.scss']
})
export class ParametresValidateursPageComponent extends BaseComponentClass implements OnInit {
  validateurs: any[] = []
  loading = false

  constructor(private validateurService: ValidateurService) { super() }

  ngOnInit(): void {
    this.loadValidateurs()
  }

  loadValidateurs() {
    this.loading = true
    this.validateurService.getAll().subscribe({
      next: (items: Validateur[]) => {
        this.validateurs = items.map(v => ({
          id: v.id,
          utilisateur: getNomUtilisateur(v.utilisateur),
          niveau: v.niveau,
          montantMax: v.montantMax,
          actif: v.actif,
        }))
        this.loading = false
      },
      error: () => {
        this.validateurs = []
        this.loading = false
      }
    })
  }

  getStatutBadge(actif: boolean): string {
    return actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }
}
