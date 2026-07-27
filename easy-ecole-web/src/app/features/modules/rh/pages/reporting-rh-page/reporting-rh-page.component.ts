import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhEmployeService } from 'src/app/data/modules/rh/services/rh-employe.service';
import { RhHeureSupplementaireService } from 'src/app/data/modules/rh/services/rh-heure-supplementaire.service';
import { RhPretService } from 'src/app/data/modules/rh/services/rh-pret.service';
import { HeureSupplementaire } from 'src/app/data/modules/rh/models/HeureSupplementaire.model';
import { PretEmploye } from 'src/app/data/modules/rh/models/PretEmploye.model';

@Component({
  selector: 'app-reporting-rh-page',
  templateUrl: './reporting-rh-page.component.html',
  styleUrls: ['./reporting-rh-page.component.scss']
})
export class ReportingRhPageComponent extends BaseComponentClass implements OnInit {
  loading: boolean = false;
  totalEmployes: number = 0;
  masseSalariale: number = 0;
  heuresSupTotal: number = 0;
  pretsEnCours: number = 0;
  heuresSupCount: number = 0;
  pretsCount: number = 0;

  constructor(
    private employeService: RhEmployeService,
    private heureService: RhHeureSupplementaireService,
    private pretService: RhPretService,
  ) { super(); }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.employeService.getAll().subscribe({
      next: (employes) => {
        this.totalEmployes = employes.length;
      }
    });
    this.heureService.getAll().subscribe({
      next: (heures: HeureSupplementaire[]) => {
        this.heuresSupTotal = heures.reduce((acc, h) => acc + (h.montant || 0), 0);
        this.heuresSupCount = heures.length;
      }
    });
    this.pretService.getAll().subscribe({
      next: (prets: PretEmploye[]) => {
        this.pretsEnCours = prets.filter(p => p.statut === 'En cours' || p.statut === 'En attente').length;
        this.pretsCount = prets.length;
        this.masseSalariale = prets.reduce((acc, p) => acc + (p.mensualite || 0), 0);
      },
      complete: () => this.loading = false
    });
  }
}
