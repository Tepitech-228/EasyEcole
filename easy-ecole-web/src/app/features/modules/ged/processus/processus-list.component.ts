import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GedService, GedProcessus } from 'src/app/data/modules/ged/services/ged.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-processus-list',
  templateUrl: './processus-list.component.html',
  styleUrls: ['./processus-list.component.scss']
})
export class ProcessusListComponent implements OnInit {
  processus: GedProcessus[] = [];
  loading = false;
  togglingId: number | null = null;

  constructor(
    private gedService: GedService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProcessus();
  }

  loadProcessus(): void {
    this.loading = true;
    this.gedService.getProcessusList().subscribe({
      next: (res) => {
        this.processus = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des processus');
      }
    });
  }

  toggleActif(proc: GedProcessus): void {
    this.togglingId = proc.id;
    this.gedService.toggleProcessus(proc.id, !proc.actif).subscribe({
      next: () => {
        proc.actif = !proc.actif;
        this.togglingId = null;
        this.toastService.success(`Processus ${proc.actif ? 'activé' : 'désactivé'}`);
      },
      error: () => {
        this.togglingId = null;
        this.toastService.error('Erreur lors de la modification');
      }
    });
  }

  editProcessus(id: number): void {
    this.router.navigate(['/ged/processus', id, 'edit']);
  }

  newProcessus(): void {
    this.router.navigate(['/ged/processus', 'new']);
  }
}
