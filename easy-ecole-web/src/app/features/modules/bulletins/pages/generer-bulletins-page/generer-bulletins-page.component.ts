import { Component, signal } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';

@Component({
  selector: 'app-generer-bulletins-page',
  templateUrl: './generer-bulletins-page.component.html',
  styleUrls: ['./generer-bulletins-page.component.scss']
})
export class GenererBulletinsPageComponent {
  anneeAcademiqueId = signal<number | null>(null);
  semestre = signal<string>('');
  classeId = signal<number | null>(null);
  loading = signal(false);
  resultat = signal<any[] | null>(null);
  erreur = signal<string | null>(null);

  constructor(private bulletinService: BulletinService) {}

  generer() {
    if (!this.anneeAcademiqueId() || !this.semestre() || !this.classeId()) return;
    this.loading.set(true);
    this.erreur.set(null);
    this.resultat.set(null);

    this.bulletinService.generer(this.classeId()!, this.semestre()!, this.anneeAcademiqueId()!).subscribe({
      next: (data) => this.resultat.set(data),
      error: (err) => this.erreur.set(err.error?.message || 'Erreur de génération'),
      complete: () => this.loading.set(false)
    });
  }
}
