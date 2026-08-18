import { Component, OnInit } from '@angular/core';
import { ConfidentialityLevel, GedService, GedPermission, ProcessusGenerateur, GedDomain } from 'src/app/data/modules/ged/services/ged.service';
import { ToastService } from 'src/app/core/services/toast.service';

const ROLES_DISPONIBLES = [
  'apprenant',
  'institution',
  'admin',
  'enseignant',
  'ressources_humaines',
  'caissier_banque',
  'cabinet_comptable',
  'comite_orientation'
];

const NIVEAUX_CONFIDENTIALITE: { value: ConfidentialityLevel; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'interne', label: 'Interne' },
  { value: 'restreint', label: 'Restreint' },
  { value: 'confidentiel', label: 'Confidentiel' }
];

@Component({
  selector: 'app-permissions-ged',
  templateUrl: './permissions-ged.component.html',
  styleUrls: ['./permissions-ged.component.scss']
})
export class PermissionsGedComponent implements OnInit {
  readonly rolesDisponibles = ROLES_DISPONIBLES;
  readonly niveauxConfidentialite = NIVEAUX_CONFIDENTIALITE;

  permissions: GedPermission[] = [];
  filteredPermissions: GedPermission[] = [];
  processusGenerateurs: ProcessusGenerateur[] = [];
  domaines: GedDomain[] = [];

  filterRole = '';
  filterProcessus = '';
  filterDomaine = '';

  loading = false;
  saving = false;
  deletingId: number | null = null;

  showAddForm = false;
  adding = false;
  newRole = '';
  newConfidentiality: ConfidentialityLevel = 'public';
  newProcessusGenerateurId = '';
  newDomaineId = '';
  newCanRead = true;
  newCanWrite = false;
  newCanDelete = false;
  newCanDownload = true;

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
    this.gedService.getProcessusGenerateurs().subscribe({
      next: (proc) => this.processusGenerateurs = proc
    });
    this.gedService.getDomains().subscribe({
      next: (dom) => this.domaines = dom
    });
  }

  applyFilters(): void {
    this.filteredPermissions = this.permissions.filter(p => {
      if (this.filterRole && !p.role.toLowerCase().includes(this.filterRole.toLowerCase())) return false;
      if (this.filterProcessus && String(p.processusGenerateurId ?? '') !== this.filterProcessus) return false;
      if (this.filterDomaine && String(p.domainId ?? '') !== this.filterDomaine) return false;
      return true;
    });
  }

  togglePermission(perm: GedPermission, field: 'canRead' | 'canWrite' | 'canDelete' | 'canDownload'): void {
    perm[field] = !perm[field];
  }

  savePermissions(): void {
    this.saving = true;
    const payload = this.permissions.map(p => ({
      role: p.role,
      confidentialityLevel: p.confidentialityLevel,
      canRead: p.canRead,
      canWrite: p.canWrite,
      canDelete: p.canDelete,
      canDownload: p.canDownload,
      processusGenerateurId: p.processusGenerateurId || null,
      domainId: p.domainId || null
    }));
    this.gedService.bulkUpdatePermissions(payload).subscribe({
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

  deletePermission(perm: GedPermission): void {
    if (!confirm(`Retirer la permission "${perm.role}" (${this.getConfidentialityLabel(perm.confidentialityLevel)}) ?`)) return;
    this.deletingId = perm.id;
    this.gedService.deletePermission(perm.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.permissions = this.permissions.filter(p => p.id !== perm.id);
        this.applyFilters();
        this.toastService.success('Permission retirée');
      },
      error: () => {
        this.deletingId = null;
        this.toastService.error('Erreur lors de la suppression de la permission');
      }
    });
  }

  openAddForm(): void {
    this.newRole = this.uniqueRoles[0] || ROLES_DISPONIBLES[0];
    this.newConfidentiality = 'public';
    this.newProcessusGenerateurId = '';
    this.newDomaineId = '';
    this.newCanRead = true;
    this.newCanWrite = false;
    this.newCanDelete = false;
    this.newCanDownload = true;
    this.showAddForm = true;
  }

  closeAddForm(): void {
    this.showAddForm = false;
  }

  addPermission(): void {
    if (!this.newRole || !this.newConfidentiality) {
      this.toastService.error('Rôle et niveau de confidentialité sont requis');
      return;
    }
    this.adding = true;
    this.gedService.createPermission({
      role: this.newRole,
      confidentialityLevel: this.newConfidentiality,
      canRead: this.newCanRead,
      canWrite: this.newCanWrite,
      canDelete: this.newCanDelete,
      canDownload: this.newCanDownload,
      processusGenerateurId: this.newProcessusGenerateurId || null,
      domainId: this.newDomaineId ? Number(this.newDomaineId) : null
    }).subscribe({
      next: (created) => {
        this.adding = false;
        this.showAddForm = false;
        this.permissions = [...this.permissions, created];
        this.applyFilters();
        this.toastService.success('Permission ajoutée');
      },
      error: () => {
        this.adding = false;
        this.toastService.error('Erreur lors de l\'ajout de la permission');
      }
    });
  }

  get uniqueRoles(): string[] {
    const roles = this.permissions.map(p => p.role);
    ROLES_DISPONIBLES.forEach(r => { if (!roles.includes(r)) roles.push(r); });
    return roles;
  }

  getProcessusLabel(perm?: Pick<GedPermission, 'processusGenerateur' | 'processusGenerateurId'>): string {
    if (!perm?.processusGenerateurId) return '-';
    const p = perm.processusGenerateur;
    return p ? `${p.code} - ${p.libelle}` : `#${perm.processusGenerateurId}`;
  }

  getDomaineLabel(perm?: Pick<GedPermission, 'domain' | 'domainId'>): string {
    if (!perm?.domainId) return '-';
    const d = perm.domain;
    return d ? d.label : `#${perm.domainId}`;
  }

  getConfidentialityBadge(level: ConfidentialityLevel): string {
    const map: Record<ConfidentialityLevel, string> = {
      'public': 'bg-emerald-100 text-emerald-700',
      'interne': 'bg-blue-100 text-blue-700',
      'restreint': 'bg-orange-100 text-orange-700',
      'confidentiel': 'bg-red-100 text-red-700'
    };
    return map[level] || 'bg-gray-100 text-gray-600';
  }

  getConfidentialityLabel(level: ConfidentialityLevel): string {
    const found = NIVEAUX_CONFIDENTIALITE.find(n => n.value === level);
    return found?.label || level || '-';
  }
}
