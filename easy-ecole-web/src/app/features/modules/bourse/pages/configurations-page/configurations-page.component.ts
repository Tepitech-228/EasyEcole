import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { BourseService } from 'src/app/data/modules/bourse/services/bourse.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-configurations-bourse-page',
  templateUrl: './configurations-page.component.html',
  styleUrls: ['./configurations-page.component.scss']
})
export class ConfigurationsPageComponent extends BaseComponentClass implements OnInit {

  configurations: any[] = [];
  loading: boolean = false;
  searchTerm: string = '';

  showModal: boolean = false;
  editingConfig: any = null;
  formData: any = {};
  saving: boolean = false;

  showDetailModal: boolean = false;
  detailConfig: any = null;

  constructor(
    private bourseService: BourseService,
    private toastService: ToastService,
  ) { super(); }

  ngOnInit(): void {
    this.loadConfigurations();
  }

  loadConfigurations(): void {
    this.loading = true;
    this.bourseService.getConfigurations().subscribe({
      next: (res) => {
        this.configurations = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des configurations');
      }
    });
  }

  get filteredConfigurations(): any[] {
    return this.configurations.filter(c =>
      !this.searchTerm ||
      (c.nom || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (c.type || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openAddModal(): void {
    this.editingConfig = null;
    this.formData = { nom: '', type: 'PARTIELLE', taux: 50, description: '', statut: 'ACTIVE' };
    this.showModal = true;
  }

  openEditModal(config: any): void {
    this.editingConfig = config;
    this.formData = {
      nom: config.nom || '',
      type: config.type || 'PARTIELLE',
      taux: config.taux || 50,
      description: config.description || '',
      statut: config.statut || 'ACTIVE',
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingConfig = null;
    this.formData = {};
  }

  openDetail(config: any): void {
    this.detailConfig = config;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.detailConfig = null;
  }

  onTypeChange(): void {
    if (this.formData.type === 'TOTAL') {
      this.formData.taux = 100;
    }
  }

  saveConfiguration(): void {
    if (!this.formData.nom || !this.formData.nom.trim()) {
      this.toastService.error('Le nom est obligatoire');
      return;
    }
    if (!this.formData.type) {
      this.toastService.error('Le type est obligatoire');
      return;
    }
    if (this.formData.type === 'PARTIELLE') {
      const taux = parseFloat(this.formData.taux);
      if (isNaN(taux) || taux <= 0 || taux >= 100) {
        this.toastService.error('Pour une bourse partielle, le taux doit être supérieur à 0 et inférieur à 100');
        return;
      }
    }

    this.saving = true;
    const obs = this.editingConfig
      ? this.bourseService.updateConfiguration(this.editingConfig.id, this.formData)
      : this.bourseService.createConfiguration(this.formData);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadConfigurations();
        this.toastService.success(this.editingConfig ? 'Configuration modifiée' : 'Configuration créée');
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.error?.message || 'Erreur lors de l\'enregistrement');
      }
    });
  }

  toggleStatut(config: any): void {
    this.bourseService.toggleStatutConfiguration(config.id).subscribe({
      next: () => {
        this.loadConfigurations();
        this.toastService.success(`Configuration ${config.statut === 'ACTIVE' ? 'désactivée' : 'activée'}`);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Erreur lors du changement de statut');
      }
    });
  }

  getStatutBadge(statut: string): string {
    return statut === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getTypeBadge(type: string): string {
    return type === 'TOTAL' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }
}
