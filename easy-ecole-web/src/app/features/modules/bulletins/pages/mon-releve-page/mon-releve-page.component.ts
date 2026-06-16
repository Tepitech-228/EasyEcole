import { Component, OnInit, signal } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-mon-releve-page',
  templateUrl: './mon-releve-page.component.html',
  styleUrls: ['./mon-releve-page.component.scss']
})
export class MonRelevePageComponent implements OnInit {
  releve = signal<any | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private bulletinService: BulletinService) {}

  ngOnInit() {
    this.loading.set(true);
    this.bulletinService.monReleve().subscribe({
      next: (data) => this.releve.set(data),
      error: (err) => this.error.set(err.error?.message || 'Aucun relevé disponible'),
      complete: () => this.loading.set(false)
    });
  }

  imprimer() {
    window.print();
  }
}
