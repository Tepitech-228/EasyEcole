import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Pointage } from 'src/app/data/modules/inscription/models/Pointage.model';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';

@Component({
  selector: 'app-historique-pointage-page',
  templateUrl: './historique-pointage-page.component.html',
  styleUrls: ['./historique-pointage-page.component.scss']
})
export class HistoriquePointagePageComponent extends BaseComponentClass {
  pointages: Pointage[] = []
  loading: boolean = false

  constructor(private pointageService: PointageService) {
    super()
    this.loadPointages()
  }

  private loadPointages(): void {
    this.loading = true
    this.pointageService.getAll().subscribe({
      next: (res) => {
        this.pointages = res
        this.loading = false
      },
      error: () => { this.loading = false }
    })
  }
}
