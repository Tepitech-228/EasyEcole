import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClotureCaisseService } from 'src/app/data/modules/scolarite/services/cloture-caisse.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-cloture-caisse-page',
  templateUrl: './cloture-caisse-page.component.html',
  styleUrls: ['./cloture-caisse-page.component.scss']
})
export class ClotureCaissePageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = true;
  clotures: any[] = [];
  montantReel: number = 0;
  clotureId: string | null = null;

  constructor(private clotureService: ClotureCaisseService) {
    super();
  }

  ngOnInit(): void {
    this.loadClotures();
  }

  loadClotures(): void {
    this.loading = true;
    this.clotureService.getAll().subscribe({
      next: (data) => { this.clotures = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ouvrir(): void {
    this.clotureService.ouvrir().subscribe({
      next: () => { this.loadClotures(); },
      error: (err) => console.error(err)
    });
  }

  cloturer(): void {
    if (!this.clotureId) return;
    this.clotureService.cloturer(this.clotureId, this.montantReel).subscribe({
      next: () => {
        this.montantReel = 0;
        this.clotureId = null;
        this.loadClotures();
      },
      error: (err) => console.error(err)
    });
  }
}
