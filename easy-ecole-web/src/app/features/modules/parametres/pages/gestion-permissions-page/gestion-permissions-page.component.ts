import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { PermissionService } from 'src/app/data/modules/auth/services/permission.service';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';

/** Permission telle que renvoyée par GET /permissions (regroupée par module). */
interface PermissionItem {
  id: number
  key: string
  libelle: string
  type: 'menu' | 'action'
  parentKey?: string | null
}

interface PermissionsParModule {
  [module: string]: PermissionItem[]
}

@Component({
  selector: 'app-gestion-permissions-page',
  templateUrl: './gestion-permissions-page.component.html',
  styleUrls: ['./gestion-permissions-page.component.scss']
})
export class GestionPermissionsPageComponent extends BaseComponentClass implements OnInit, OnDestroy {

  private static readonly ROLE_LABELS: { [role: string]: string } = {
    [RolesUtilisateur.ADMIN]: 'Administrateur',
    [RolesUtilisateur.INSTITUTION]: 'Institution',
    [RolesUtilisateur.ENSEIGNANT]: 'Enseignant',
    [RolesUtilisateur.APPRENANT]: 'Apprenant',
    [RolesUtilisateur.CAISSIER_BANQUE]: 'Caissier',
    [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel administratif',
    [RolesUtilisateur.RESSOURCES_HUMAINES]: 'Ressources humaines',
    [RolesUtilisateur.CABINET_COMPTABLE]: 'Cabinet comptable',
    [RolesUtilisateur.ESA_COMPTA]: 'ESA Compta',
    [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'orientation",
    [RolesUtilisateur.PARENT]: 'Parent',
    [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
    [RolesUtilisateur.SURVEILLANT]: 'Surveillant',
    [RolesUtilisateur.SUPERVISEUR_GENERAL]: 'Superviseur général'
  }

  @ViewChild('permPanel') permPanel?: ElementRef<HTMLElement>
  @ViewChild('copySearchInput') copySearchInput?: ElementRef<HTMLInputElement>

  /** Squelettes de chargement (tableau statique pour un *ngFor stable). */
  readonly skeletonCards = [1, 2, 3, 4]

  utilisateurs: Utilisateur[] = []
  selectedUtilisateur: Utilisateur | null = null
  permissionsGrouped: PermissionsParModule = {}
  userPermissions: Set<number> = new Set<number>()
  /** Dernier état confirmé par le serveur (sert au dirty et à la réinitialisation). */
  savedPermissions: Set<number> = new Set<number>()

  loadingUsers = false
  loadingCatalogue = false
  loadingPermissions = false
  saving = false
  copying = false

  searchTerm = ''
  copySearchTerm = ''
  showCopyModal = false
  copySourceUser: Utilisateur | null = null
  copyError = ''
  /** Message affiché en bandeau lorsqu'une action d'écriture est refusée (403). */
  accessDeniedMessage = ''
  /** Erreur de chargement de la liste (403, réseau…) : évite un faux « aucun utilisateur ». */
  usersError = ''

  private readonly destroy$ = new Subject<void>()
  /** Évite qu'une réponse obsolète écrase les permissions d'un autre utilisateur. */
  private permissionRequestId = 0

  constructor(
    private permissionService: PermissionService,
    private utilisateurService: UtilisateurService,
    private toastService: ToastService
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadUtilisateurs()
    this.loadPermissions()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // ── Droits de l'utilisateur connecté ─────────────────────────────────────

  /** Seul un ADMIN peut écrire (PUT /utilisateur/:id et POST copy-from). */
  get canManage(): boolean {
    return this.rolesValue.isAdmin
  }

  // ── Chargements ──────────────────────────────────────────────────────────

  loadUtilisateurs(): void {
    this.loadingUsers = true
    this.usersError = ''
    this.utilisateurService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const liste = Array.isArray(res) ? res : []
        this.utilisateurs = liste
          .slice()
          .sort((a, b) => this.displayName(a).localeCompare(this.displayName(b), 'fr', { sensitivity: 'base' }))
        this.loadingUsers = false
      },
      error: (err) => {
        this.loadingUsers = false
        this.utilisateurs = []
        this.usersError = this.notifyHttpError(err, 'Impossible de charger la liste des utilisateurs.')
      }
    })
  }

  loadPermissions(): void {
    this.loadingCatalogue = true
    this.permissionService.getAllPermissions().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.permissionsGrouped = res && typeof res === 'object' ? res : {}
        this.loadingCatalogue = false
      },
      error: (err) => {
        this.permissionsGrouped = {}
        this.loadingCatalogue = false
        this.notifyHttpError(err, 'Impossible de charger le catalogue des permissions.')
      }
    })
  }

  /**
   * Charge les permissions d'un utilisateur.
   * `silent` conserve l'affichage en place (rechargement après sauvegarde/copie).
   */
  loadUserPermissions(silent: boolean = false): void {
    const user = this.selectedUtilisateur
    if (!user || !user.id) return

    const requestId = ++this.permissionRequestId
    if (!silent) this.loadingPermissions = true

    this.permissionService.getUtilisateurPermissions(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (requestId !== this.permissionRequestId) return
        const rows = Array.isArray(res) ? res : []
        const ids = rows
          .map((row: any) => Number(row && row.permissionId))
          .filter((id: number) => Number.isFinite(id))

        this.userPermissions = new Set<number>(ids)
        this.savedPermissions = new Set<number>(ids)
        this.loadingPermissions = false
      },
      error: (err) => {
        if (requestId !== this.permissionRequestId) return
        this.loadingPermissions = false
        this.userPermissions = new Set<number>()
        this.savedPermissions = new Set<number>()
        this.notifyHttpError(err, 'Impossible de charger les permissions de cet utilisateur.')
      }
    })
  }

  // ── Sélection ────────────────────────────────────────────────────────────

  selectUtilisateur(user: Utilisateur): void {
    if (this.saving || this.copying) return
    if (this.selectedUtilisateur && this.selectedUtilisateur.id === user.id) return
    if (this.isDirty) this.toastService.warning('Modifications non enregistrées ignorées.')

    this.selectedUtilisateur = user
    this.searchTerm = ''
    this.accessDeniedMessage = ''
    this.userPermissions = new Set<number>()
    this.savedPermissions = new Set<number>()
    this.loadUserPermissions()
    this.scrollPanelIntoViewOnMobile()
  }

  clearSelection(): void {
    if (this.saving || this.copying) return
    if (this.isDirty) this.toastService.warning('Modifications non enregistrées ignorées.')
    this.permissionRequestId++
    this.selectedUtilisateur = null
    this.userPermissions = new Set<number>()
    this.savedPermissions = new Set<number>()
    this.accessDeniedMessage = ''
    this.loadingPermissions = false
  }

  private scrollPanelIntoViewOnMobile(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (!window.matchMedia('(max-width: 1023px)').matches) return
    setTimeout(() => this.permPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  // ── Filtres ──────────────────────────────────────────────────────────────

  get filteredUtilisateurs(): Utilisateur[] {
    const term = this.normalize(this.searchTerm)
    if (!term) return this.utilisateurs
    return this.utilisateurs.filter(u => this.matchesUser(u, term))
  }

  get copyCandidates(): Utilisateur[] {
    const term = this.normalize(this.copySearchTerm)
    const selectedId = this.selectedUtilisateur ? this.selectedUtilisateur.id : null
    return this.utilisateurs.filter(u => {
      if (u.id === selectedId) return false
      return !term || this.matchesUser(u, term)
    })
  }

  private matchesUser(user: Utilisateur, normalizedTerm: string): boolean {
    return [user.nom, user.prenoms, user.identifiant, user.email]
      .some(value => this.normalize(value).includes(normalizedTerm))
  }

  /** Comparaison insensible à la casse ET aux accents. */
  private normalize(value: string | null | undefined): string {
    if (!value) return ''
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  // ── Toggles (état local uniquement : la sauvegarde est explicite) ────────

  hasPermission(permissionId: number): boolean {
    return this.userPermissions.has(Number(permissionId))
  }

  togglePermission(permissionId: number): void {
    if (!this.selectedUtilisateur || !this.canManage || this.saving) return
    const id = Number(permissionId)
    const next = new Set<number>(this.userPermissions)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    this.userPermissions = next
  }

  /** Coche tout le module, ou décoche tout s'il est déjà entièrement coché. */
  toggleModule(module: string): void {
    if (!this.selectedUtilisateur || !this.canManage || this.saving) return
    const permissions = this.permissionsGrouped[module] || []
    if (!permissions.length) return

    const toutCoche = this.isModuleFullyChecked(module)
    const next = new Set<number>(this.userPermissions)
    for (const perm of permissions) {
      const id = Number(perm.id)
      if (toutCoche) {
        next.delete(id)
      } else {
        next.add(id)
      }
    }
    this.userPermissions = next
  }

  isModuleFullyChecked(module: string): boolean {
    const permissions = this.permissionsGrouped[module] || []
    return permissions.length > 0 && permissions.every(p => this.userPermissions.has(Number(p.id)))
  }

  isModulePartiallyChecked(module: string): boolean {
    const permissions = this.permissionsGrouped[module] || []
    const checked = permissions.filter(p => this.userPermissions.has(Number(p.id)))
    return checked.length > 0 && checked.length < permissions.length
  }

  moduleActiveCount(module: string): number {
    const permissions = this.permissionsGrouped[module] || []
    return permissions.filter(p => this.userPermissions.has(Number(p.id))).length
  }

  moduleTotal(module: string): number {
    return (this.permissionsGrouped[module] || []).length
  }

  // ── Compteurs / dirty ────────────────────────────────────────────────────

  get modules(): string[] {
    return Object.keys(this.permissionsGrouped)
  }

  get totalPermissionsCount(): number {
    return this.modules.reduce((total, module) => total + this.moduleTotal(module), 0)
  }

  /** Compté sur le catalogue affiché : évite un total incohérent si une permission a été supprimée côté serveur. */
  get activePermissionsCount(): number {
    return this.modules.reduce((total, module) => total + this.moduleActiveCount(module), 0)
  }

  get activeModulesCount(): number {
    return this.modules.filter(module => this.moduleActiveCount(module) > 0).length
  }

  get isDirty(): boolean {
    if (this.userPermissions.size !== this.savedPermissions.size) return true
    let dirty = false
    this.userPermissions.forEach(id => {
      if (!this.savedPermissions.has(id)) dirty = true
    })
    return dirty
  }

  // ── Sauvegarde / réinitialisation ────────────────────────────────────────

  resetPermissions(): void {
    if (!this.selectedUtilisateur || this.saving) return
    this.userPermissions = new Set<number>(this.savedPermissions)
    this.accessDeniedMessage = ''
    this.toastService.info('Modifications annulées : dernier état enregistré restauré.')
  }

  savePermissions(): void {
    const target = this.selectedUtilisateur
    if (!target || !target.id || !this.canManage || this.saving) return
    if (!this.isDirty) {
      this.toastService.info('Aucune modification à enregistrer.')
      return
    }

    this.saving = true
    this.accessDeniedMessage = ''

    this.permissionService.updateUtilisateurPermissions(target.id, { permissions: this.buildPermissionPayload() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false
          this.savedPermissions = new Set<number>(this.userPermissions)
          this.toastService.success(`Permissions de ${this.displayName(target)} enregistrées.`)
          this.loadUserPermissions(true)
        },
        error: (err) => {
          this.saving = false
          this.notifyHttpError(err, "L'enregistrement des permissions a échoué.")
        }
      })
  }

  /** Le backend attend la liste complète : chaque permission avec son état. */
  private buildPermissionPayload(): Array<{ permissionId: number; estActif: boolean }> {
    const payload: Array<{ permissionId: number; estActif: boolean }> = []
    for (const module of this.modules) {
      for (const perm of this.permissionsGrouped[module]) {
        const id = Number(perm.id)
        payload.push({ permissionId: id, estActif: this.userPermissions.has(id) })
      }
    }
    return payload
  }

  // ── Copie depuis un autre utilisateur ────────────────────────────────────

  openCopyModal(): void {
    if (!this.selectedUtilisateur || !this.canManage || this.saving) return
    this.showCopyModal = true
    this.copySourceUser = null
    this.copySearchTerm = ''
    this.copyError = ''
    setTimeout(() => this.copySearchInput?.nativeElement.focus(), 50)
  }

  closeCopyModal(): void {
    if (this.copying) return
    this.showCopyModal = false
    this.copySourceUser = null
    this.copySearchTerm = ''
    this.copyError = ''
  }

  selectCopySource(user: Utilisateur): void {
    if (this.copying) return
    this.copySourceUser = user
    this.copyError = ''
  }

  confirmCopy(): void {
    const target = this.selectedUtilisateur
    const source = this.copySourceUser
    if (!target || !source || !target.id || !source.id || this.copying) return
    if (target.id === source.id) return

    this.copying = true
    this.copyError = ''
    this.accessDeniedMessage = ''

    this.permissionService.copyPermissions(target.id, source.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.copying = false
          this.showCopyModal = false
          this.copySourceUser = null
          this.copySearchTerm = ''
          this.toastService.success(`Permissions copiées depuis ${this.displayName(source)}.`)
          this.loadUserPermissions(true)
        },
        error: (err) => {
          this.copying = false
          this.copyError = this.notifyHttpError(err, 'La copie des permissions a échoué.')
        }
      })
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showCopyModal) this.closeCopyModal()
  }

  // ── Erreurs HTTP ─────────────────────────────────────────────────────────

  /** Uniformise les messages, en particulier le 403 des mutations réservées aux admins. */
  private notifyHttpError(err: any, fallback: string): string {
    let message = fallback

    if (err && err.status === 403) {
      message = "Droits insuffisants : seul un compte Administrateur peut modifier les permissions."
      this.accessDeniedMessage = message
      this.toastService.warning(message)
      return message
    }

    if (err && err.status === 0) {
      message = 'Serveur injoignable. Vérifiez votre connexion puis réessayez.'
    } else if (err && err.error && typeof err.error.message === 'string' && err.error.message) {
      message = err.error.message
    }

    this.toastService.error(message)
    return message
  }

  // ── Helpers d'affichage ──────────────────────────────────────────────────

  displayName(user: Utilisateur | null | undefined): string {
    if (!user) return '—'
    const complet = [user.nom, user.prenoms].filter(Boolean).join(' ').trim()
    return complet || user.identifiant || user.email || 'Utilisateur'
  }

  initials(user: Utilisateur | null | undefined): string {
    if (!user) return '?'
    const depuisNom = `${(user.nom || '').charAt(0)}${(user.prenoms || '').charAt(0)}`.trim()
    if (depuisNom) return depuisNom.toUpperCase()
    return (user.identifiant || user.email || '?').charAt(0).toUpperCase()
  }

  /** Retourne une classe de couleur stable (classes définies en SCSS, pas de purge). */
  avatarTone(user: Utilisateur | null | undefined): string {
    const seed = user ? (user.id || user.identifiant || user.email || '') : ''
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 9973
    }
    return 'tone-' + ((hash % 3) + 1)
  }

  getRoleLabel(role?: RolesUtilisateur | null): string {
    if (!role) return 'Rôle non défini'
    return GestionPermissionsPageComponent.ROLE_LABELS[role] || role
  }

  trackByUserId(index: number, user: Utilisateur): string {
    return String(user.id || index)
  }

  trackByModule(index: number, module: string): string {
    return module
  }

  trackByPermissionId(index: number, permission: PermissionItem): number {
    return Number(permission.id)
  }
}
