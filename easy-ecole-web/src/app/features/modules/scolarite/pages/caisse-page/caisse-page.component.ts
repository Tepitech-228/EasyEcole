import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecuCaisseService } from 'src/app/data/modules/scolarite/services/recu-caisse.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-caisse-page',
  templateUrl: './caisse-page.component.html',
  styleUrls: ['./caisse-page.component.scss']
})
export class CaissePageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = true;
  recus: any[] = [];
  page: number = 1;
  total: number = 0;
  limit: number = 20;

  constructor(private recuService: RecuCaisseService) {
    super();
  }

  ngOnInit(): void {
    this.loadRecus();
  }

  loadRecus(): void {
    this.loading = true;
    this.recuService.getAll({ page: this.page, limit: this.limit }).subscribe({
      next: (res: any) => {
        this.recus = res.data || [];
        this.total = res.pagination?.total || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  printRecu(id: string): void {
    this.recuService.print(id).subscribe({
      next: (html) => {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.print();
        }
      },
      error: (err) => console.error(err)
    });
  }
}
