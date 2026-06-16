import { Component, OnInit, signal } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-liste-bulletins-page',
  templateUrl: './liste-bulletins-page.component.html',
  styleUrls: ['./liste-bulletins-page.component.scss']
})
export class ListeBulletinsPageComponent implements OnInit {
  bulletins = signal<any[]>([]);
  loading = signal(false);
  filtres: any = { classeId: '', semestre: '', anneeAcademiqueId: '', statut: '' };

  constructor(private bulletinService: BulletinService) {}

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.loading.set(true);
    this.bulletinService.getAll(this.filtres).subscribe({
      next: (data) => this.bulletins.set(data),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }

  getMentionClass(mention: string): string {
    if (!mention) return '';
    return mention.toLowerCase().replace(/ /g, '-');
  }
}
