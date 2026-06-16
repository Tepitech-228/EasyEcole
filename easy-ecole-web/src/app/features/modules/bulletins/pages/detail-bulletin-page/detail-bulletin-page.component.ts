import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-detail-bulletin-page',
  templateUrl: './detail-bulletin-page.component.html',
  styleUrls: ['./detail-bulletin-page.component.scss']
})
export class DetailBulletinPageComponent implements OnInit {
  bulletin = signal<any | null>(null);
  loading = signal(false);
  appreciation = signal('');

  constructor(
    private route: ActivatedRoute,
    private bulletinService: BulletinService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) this.charger(id);
  }

  charger(id: number) {
    this.loading.set(true);
    this.bulletinService.getOne(id).subscribe({
      next: (data) => {
        this.bulletin.set(data);
        this.appreciation.set(data.appreciation || '');
      },
      complete: () => this.loading.set(false)
    });
  }

  sauvegarderAppreciation() {
    const id = this.bulletin()?.id;
    if (!id) return;
    this.bulletinService.update(id, { appreciation: this.appreciation() }).subscribe({
      next: (data) => this.bulletin.set(data)
    });
  }

  publier() {
    const id = this.bulletin()?.id;
    if (!id) return;
    this.bulletinService.publier(id).subscribe({
      next: (data) => this.bulletin.set(data)
    });
  }

  imprimer() {
    window.print();
  }
}
