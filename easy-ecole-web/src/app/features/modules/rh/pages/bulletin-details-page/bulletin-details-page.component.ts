import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhBulletinPaieService } from 'src/app/data/modules/rh/services/rh-bulletin-paie.service';
import { BulletinPaie } from 'src/app/data/modules/rh/models/BulletinPaie.model';

@Component({
  selector: 'app-bulletin-details-page',
  templateUrl: './bulletin-details-page.component.html',
  styleUrls: ['./bulletin-details-page.component.scss']
})
export class BulletinDetailsPageComponent extends BaseComponentClass implements OnInit {
  bulletin: BulletinPaie | null = null;
  loading = false;
  gains: any[] = [];
  retenues: any[] = [];
  cotisations: any[] = [];
  totalPrimes = 0;
  totalRetenues = 0;
  totalCotisations = 0;
  totauxParSite: Array<{ nom: string; montant: number }> = [];
  totalCumulSites = 0;

  constructor(
    private route: ActivatedRoute,
    private bulletinService: RhBulletinPaieService
  ) { super() }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadBulletin(id);
  }

  loadBulletin(id: string) {
    this.loading = true;
    this.bulletinService.get(id).subscribe({
      next: (data) => {
        this.bulletin = data;
        if (data.lignesBulletin) {
          this.gains = data.lignesBulletin.filter(l => l.rubrique?.type === 'gain');
          this.retenues = data.lignesBulletin.filter(l => l.rubrique?.type === 'retenue');
          this.cotisations = data.lignesBulletin.filter(l => l.rubrique?.type === 'cotisation');
          this.totalPrimes = this.gains.reduce((s, l) => s + Number(l.montant || 0), 0);
          this.totalRetenues = this.retenues.reduce((s, l) => s + Number(l.montant || 0), 0);
          this.totalCotisations = this.cotisations.reduce((s, l) => s + Number(l.montant || 0), 0);
          const totaux = new Map<string, number>();
          this.gains.filter(l => l.siteNom).forEach(ligne => {
            const nom = String(ligne.siteNom);
            totaux.set(nom, (totaux.get(nom) || 0) + Number(ligne.montant || 0));
          });
          this.totauxParSite = Array.from(totaux, ([nom, montant]) => ({ nom, montant }));
          this.totalCumulSites = this.totauxParSite.reduce((s, site) => s + site.montant, 0);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getStatutColor(statut: string): string {
    const map: any = { brouillon: 'bg-gray-100 text-gray-700', validé: 'bg-green-100 text-green-700', versé: 'bg-blue-100 text-blue-700' };
    const s = statut?.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return map[s] || map[statut] || 'bg-gray-100 text-gray-700';
  }

  getStatutLabel(statut: string): string {
    const map: any = { brouillon: 'Brouillon', valide: 'Validé', verse: 'Versé' };
    const s = statut?.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return map[s] || statut || '';
  }

  formatMontant(v: any): string {
    return Number(v || 0).toLocaleString('fr-FR') + ' XAF';
  }

  imprimer(): void {
    window.print();
  }
}
