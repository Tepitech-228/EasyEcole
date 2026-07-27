import { Component, OnInit } from '@angular/core';
import { GedService, GedPermission, GedProcessus, GedDomain } from 'src/app/data/modules/ged/services/ged.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-permissions-ged',
  templateUrl: './permissions-ged.component.html',
  styleUrls: ['./permissions-ged.component.scss']
})
export class PermissionsGedComponent implements OnInit {
  permissions: GedPermission[] = [];
  filteredPermissions: GedPermission[] = [];
  processus: GedProcessus[] = [];
  domaines: GedDomain[] = [];

  filterRole = '';
  filterProcessus = '';
  filterDomaine = '';

  loading = false;
  saving = false;

  constructor(
    private gedService: GedService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.gedService.getPermissions().subscribe({
      next: (perms) => {
        this.permissions = perms;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des permissions');
      }
    });
    this.gedService.getProcessusList().subscribe({
      next: (proc) => this.processus = proc
    });
    this.gedService.getDomains().subscribe({
      next: (dom) => this.domaines = dom
    });
  }

  applyFilters(): void {
    this.filteredPermissions = this.permissions.filter(p => {
      if (this.filterRole && !p.role.toLowerCase().includes(this.filterRole.toLowerCase())) return false;
      if (this.filterProcessus && p.processId !== Number(this.filterProcessus)) return false;
      if (this.filterDomaine && p.domaineId !== Number(this.filterDomaine)) return false;
      return true;
    });
  }

  togglePermission(perm: GedPermission, field: 'canRead' | 'canWrite' | 'canDelete' | 'canDownload'): void {
    perm[field] = !perm[field];
  }

  savePermissions(): void {
    this.saving = true;
    this.gedService.bulkUpdatePermissions(this.permissions).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Permissions enregistrées');
      },
      error: () => {
        this.saving = false;
        this.toastService.error('Erreur lors de l\'enregistrement');
      }
    });
  }

  restoreDefaults(): void {
    if (!confirm('Restaurer les valeurs par défaut des permissions GED ?')) return;
    this.saving = true;
    this.gedService.restoreDefaultPermissions().subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Permissions restaurées par défaut');
        this.loadData();
      },
      error: () => {
        this.saving = false;
        this.toastService.error('Erreur lors de la restauration');
      }
    });
  }

  get uniqueRoles(): string[] {
    return [...new Set(this.permissions.map(p => p.role))];
  }

  getProcessusLabel(processId?: number): string {
    if (!processId) return '-';
    const p = this.processus.find(pr => pr.id === processId);
    return p ? `${p.code} - ${p.libelle}` : `#${processId}`;
  }

  getDomaineLabel(domaineId?: number): string {
    if (!domaineId) return '-';
    const d = this.domaines.find(dm => dm.id === domaineId);
    return d ? d.label : `#${domaineId}`;
  }
}
