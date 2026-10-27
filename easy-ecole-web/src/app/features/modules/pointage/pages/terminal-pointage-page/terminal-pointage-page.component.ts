import { Component, HostListener, NgZone, OnDestroy } from '@angular/core';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { HikvisionTerminalConfig, PointageService } from 'src/app/data/modules/inscription/services/pointage.service';
import { Pointage } from 'src/app/data/modules/inscription/models/Pointage.model';
import { AuthService, SiteUtilisateur } from 'src/app/data/modules/auth/services/auth.service';
import { SocketService, TerminalAttendanceEvent } from 'src/app/core/services/socket.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-terminal-pointage-page',
  templateUrl: './terminal-pointage-page.component.html',
  styleUrls: ['./terminal-pointage-page.component.scss']
})
export class TerminalPointagePageComponent extends BaseComponentClass implements OnDestroy {
  todayPointage: any = null
  loading: boolean = true
  loadError: string = ''
  scanning: boolean = false
  scanProcessing: boolean = false
  scanProcessingMessage: string = ''
  scanMode: 'arrivee' | 'depart' = 'arrivee'
  scannedUser: any = null
  private scannedCodeQR: string | null = null
  scanError: string = ''
  scanWarning: string = ''
  scanSuccess: string = ''
  scanTimeout: boolean = false
  selfSuccess: string = ''
  selfError: string = ''
  voiceAnnouncementsEnabled: boolean = true
  voiceError: string = ''
  lastAttendanceName: string = ''
  lastAttendanceRole: string = ''
  lastAttendancePhotoUrl: string = ''
  manualId: string = ''
  showManualInput: boolean = false
  readonly isAdmin: boolean
  terminalConfigOpen = false
  terminalConfigLoading = false
  terminalConfigSaving = false
  terminalConfigError = ''
  terminalConfigSuccess = ''
  terminalSites: SiteUtilisateur[] = []
  hikvisionTerminals: HikvisionTerminalConfig[] = []
  hikvisionTestingId: number | null = null
  hikvisionDraft = {
    serialNumber: '',
    nom: 'Hikvision MinMoe',
    sourceIp: '',
    port: 80,
    https: false,
    username: '',
    password: '',
    etablissementId: null as number | null
  }
  torchSupported: boolean = false
  torchOn: boolean = false
  zoomSupported: boolean = false
  zoomMin: number = 1
  zoomMax: number = 1
  zoomStep: number = 0.1
  zoomValue: number = 1
  decoderNatif: boolean = false
  streamRes: string = ''
  private html5QrCode: Html5Qrcode | null = null
  private terminalAttendanceSubscription: Subscription | null = null
  private scanTimer: any = null
  private static readonly SCAN_TIMEOUT_MS = 30000
  private static readonly CACHE_TTL_MS = 60000
  private audioCtx: AudioContext | null = null

  // Lecteur QR externe « Tovi » (clavier HID) : la carte TAPE les caractères.
  static readonly TOVI_FLUSH_MS = 400
  static readonly TOVI_CHAR_MAX_GAP_MS = 150
  static readonly TOVI_MIN_LENGTH = 4
  private toviBuffer: string = ''
  private toviLastKeyAt: number = 0
  private toviFlushTimer: any = null
  private readonly readerQueue: Array<{ codeQR: string, mode: 'arrivee' | 'depart' }> = []
  private readonly recentReaderScans = new Map<string, number>()
  private readerScanInProgress: boolean = false
  private static readonly READER_DUPLICATE_WINDOW_MS = 2500

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly TEACHER_PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS_ENSEIGNANTS
  readonly PROFILE_PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PROFILES

  constructor(
    private pointageService: PointageService,
    private authService: AuthService,
    private socketService: SocketService,
    private ngZone: NgZone
  ) {
    super()
    this.isAdmin = this.rolesValue.isAdmin
    this.loadTodayPointage()
    if (this.isAdmin) this.chargerConfigurationTerminaux()
    this.socketService.connect()
    this.terminalAttendanceSubscription = this.socketService.onTerminalAttendance().subscribe(event => {
      this.ngZone.run(() => this.afficherPointageHikvision(event))
    })
  }

  private chargerConfigurationTerminaux(): void {
    this.terminalConfigLoading = true
    this.terminalConfigError = ''
    this.authService.getSitesMoi().subscribe({
      next: sites => {
        this.terminalSites = sites
        if (!this.hikvisionDraft.etablissementId && sites.length) {
          this.hikvisionDraft.etablissementId = sites[0].id
        }
        this.terminalConfigLoading = false
      },
      error: () => {
        this.terminalConfigError = 'Les sites ne peuvent pas être chargés. Vérifiez votre connexion puis réessayez.'
        this.terminalConfigLoading = false
      }
    })
    this.chargerTerminauxHikvision()
  }

  enregistrerTerminalHikvision(): void {
    this.terminalConfigError = ''
    this.terminalConfigSuccess = ''
    const draft = this.hikvisionDraft
    const etablissementId = Number(draft.etablissementId)
    if (
      !draft.serialNumber.trim() || !draft.nom.trim() || !draft.sourceIp.trim() ||
      !draft.username.trim() || !draft.password ||
      !Number.isSafeInteger(draft.port) || draft.port < 1 || draft.port > 65535 ||
      !Number.isSafeInteger(etablissementId) || etablissementId <= 0
    ) {
      this.terminalConfigError = 'Renseignez le numéro de série, le nom, l’IP du terminal, le port, le compte, le mot de passe et le site.'
      return
    }
    this.terminalConfigSaving = true
    this.pointageService.creerTerminalHikvision({
      serialNumber: draft.serialNumber.trim(),
      nom: draft.nom.trim(),
      sourceIp: draft.sourceIp.trim(),
      port: draft.port,
      https: draft.https,
      username: draft.username.trim(),
      password: draft.password,
      etablissementId
    }).subscribe({
      next: terminal => {
        this.hikvisionTerminals = [...this.hikvisionTerminals, terminal]
        this.hikvisionDraft = { ...this.hikvisionDraft, serialNumber: '', sourceIp: '', username: '', password: '', etablissementId }
        this.terminalConfigSuccess = 'Terminal enregistré. Testez la connexion ISAPI avant le premier pointage.'
        this.terminalConfigSaving = false
        this.testerTerminalHikvision(terminal)
      },
      error: err => {
        this.terminalConfigError = err.error?.message || 'Le terminal Hikvision n’a pas pu être enregistré.'
        this.terminalConfigSaving = false
      }
    })
  }

  testerTerminalHikvision(terminal: HikvisionTerminalConfig): void {
    this.terminalConfigError = ''
    this.hikvisionTestingId = terminal.id
    this.pointageService.testerTerminalHikvision(terminal.id).subscribe({
      next: result => {
        this.terminalConfigSuccess = result.message
        this.hikvisionTestingId = null
        this.chargerTerminauxHikvision()
      },
      error: err => {
        this.terminalConfigError = err.error?.message || 'La connexion ISAPI au terminal a échoué.'
        this.hikvisionTestingId = null
      }
    })
  }

  basculerTerminalHikvision(terminal: HikvisionTerminalConfig): void {
    this.terminalConfigError = ''
    this.pointageService.modifierEtatTerminalHikvision(terminal.id, !terminal.actif).subscribe({
      next: updated => {
        this.hikvisionTerminals = this.hikvisionTerminals.map(item => item.id === updated.id ? updated : item)
      },
      error: err => {
        this.terminalConfigError = err.error?.message || 'L’état du terminal Hikvision n’a pas pu être modifié.'
      }
    })
  }

  definirPortHikvision(): void {
    this.hikvisionDraft.port = this.hikvisionDraft.https ? 443 : 80
  }

  private chargerTerminauxHikvision(): void {
    this.pointageService.getTerminauxHikvision().subscribe({
      next: terminals => this.hikvisionTerminals = terminals,
      error: err => {
        this.terminalConfigError = err.error?.message || 'Les terminaux Hikvision n’ont pas pu être chargés.'
      }
    })
  }

  terminalEstEnLigne(terminal: Pick<HikvisionTerminalConfig, 'lastSeenAt'>): boolean {
    return !!terminal.lastSeenAt && Date.now() - new Date(terminal.lastSeenAt).getTime() < 5 * 60 * 1000
  }

  nomSiteTerminal(terminal: Pick<HikvisionTerminalConfig, 'etablissementId'>): string {
    const site = this.terminalSites.find(item => Number(item.id) === Number(terminal.etablissementId))
    return site ? site.nom : `Site ${terminal.etablissementId}`
  }

  get hikvisionStatusLabel(): string {
    if (this.hikvisionTerminals.some(terminal => this.terminalEstEnLigne(terminal))) return 'CONNECTÉ'
    if (this.hikvisionTerminals.some(terminal => terminal.actif)) return 'CONFIGURÉ'
    return 'À CONFIGURER'
  }

  private afficherPointageHikvision(event: TerminalAttendanceEvent): void {
    this.lastAttendanceName = this.formatPersonName(event)
    this.lastAttendanceRole = this.roleLabel(event.role)
    this.lastAttendancePhotoUrl = this.buildPhotoUrl(event.photo, event.photoType)
    this.scanError = ''
    this.scanWarning = ''

    if (event.mode === 'refuse') {
      this.scanSuccess = ''
      this.scanError = event.motifRefus || 'Accès refusé'
      this.playBeepRefus()
      this.announceAttendance(event, 'refuse', event.time)
      return
    }

    if (event.mode === 'depart') {
      this.scanSuccess = `Départ enregistré à ${event.time}`
    } else if (event.mode === 'passage') {
      this.scanSuccess = `Passage enregistré à ${event.time}`
    } else {
      this.scanSuccess = `Arrivée enregistrée à ${event.time}`
    }
    this.playBeepSucces()
    this.announceAttendance(event, event.mode, event.time)
  }

  ngOnDestroy(): void {
    this.terminalAttendanceSubscription?.unsubscribe()
    this.stopScanner()
    this.clearScanTimer()
    this.clearToviFlushTimer()
    if (this.audioCtx) {
      this.audioCtx.close()
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  /* ============================================================
     LECTEUR EXTERNE (Tovi — clavier HID / keyboard-wedge)
     Écoute permanente au niveau document : le scan est reconnu
     quel que soit l'état affiché, sans clic ni souris.
     ============================================================ */

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    // E4 — ne jamais capturer la frappe saisie dans un champ de formulaire.
    if (this.isEditableTarget(event.target)) return
    // AltGr est requis pour des caractères QR comme `|` sur AZERTY.
    // Les vrais raccourcis Ctrl/Alt/Meta restent ignorés.
    const altGraph = event.getModifierState('AltGraph')
    if (event.metaKey || ((event.ctrlKey || event.altKey) && !altGraph)) return
    // Maintien de touche : ignoré (le lecteur émet une frappe par caractère).
    if (event.repeat) return

    // E2 (a) — fin de scan sur Enter : validation immédiate du buffer.
    if (event.key === 'Enter') {
      if (this.toviBuffer.length > 0) {
        event.preventDefault()
        event.stopPropagation()
      }
      this.flushToviBuffer()
      return
    }

    // Caractères imprimables uniquement (une seule unité) : ignore Tab,
    // Escape, flèches, F1-F12, Shift seul, Backspace, etc.
    if (event.key.length !== 1) return

    const now = Date.now()
    // Cadence lecteur : une pause > 150 ms signale une frappe humaine,
    // le buffer précédent est abandonné.
    if (this.toviBuffer.length > 0
      && now - this.toviLastKeyAt > TerminalPointagePageComponent.TOVI_CHAR_MAX_GAP_MS) {
      this.toviBuffer = ''
    }
    this.toviLastKeyAt = now
    this.toviBuffer += event.key

    // E2 (b) — fin de scan par interruption (~400 ms d'inactivité).
    this.restartToviFlushTimer()
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null
    if (!el || typeof el.tagName !== 'string') return false
    const tag = el.tagName.toUpperCase()
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    if (el.isContentEditable) return true
    return typeof el.closest === 'function' && el.closest('[contenteditable]') !== null
  }

  private restartToviFlushTimer(): void {
    this.clearToviFlushTimer()
    this.toviFlushTimer = setTimeout(
      () => this.flushToviBuffer(),
      TerminalPointagePageComponent.TOVI_FLUSH_MS
    )
  }

  private clearToviFlushTimer(): void {
    if (this.toviFlushTimer) {
      clearTimeout(this.toviFlushTimer)
      this.toviFlushTimer = null
    }
  }

  /** Valide le buffer du lecteur puis le vide (E5). */
  private flushToviBuffer(): void {
    const code = this.toviBuffer.trim()
    this.toviBuffer = ''
    this.toviLastKeyAt = 0
    this.clearToviFlushTimer()
    if (code.length < TerminalPointagePageComponent.TOVI_MIN_LENGTH) return
    this.onToviScan(code)
  }

  /**
   * Le lecteur HID ne dépend pas de l'ouverture de la caméra. Chaque code
   * passe par la validation serveur puis par l'API QR qui revalide le jeton
   * avant d'enregistrer le pointage.
   */
  private onToviScan(code: string): void {
    const normalizedCode = code.trim()
    if (normalizedCode.length < TerminalPointagePageComponent.TOVI_MIN_LENGTH) return

    const now = Date.now()
    this.recentReaderScans.forEach((expiresAt, previousCode) => {
      if (expiresAt <= now) this.recentReaderScans.delete(previousCode)
    })
    if ((this.recentReaderScans.get(normalizedCode) || 0) > now) return
    this.recentReaderScans.set(
      normalizedCode,
      now + TerminalPointagePageComponent.READER_DUPLICATE_WINDOW_MS
    )

    this.resetScan()
    this.scanProcessing = true
    this.scanProcessingMessage = 'Code QR reçu. Vérification de l’identité auprès du serveur…'
    this.readerQueue.push({ codeQR: normalizedCode, mode: this.scanMode })
    this.playBeep()
    void this.stopScanner()
    this.processNextReaderScan()
  }

  private processNextReaderScan(): void {
    if (this.readerScanInProgress) return
    const scan = this.readerQueue.shift()
    if (!scan) {
      this.scanProcessing = false
      this.scanProcessingMessage = ''
      return
    }

    this.readerScanInProgress = true
    this.scanProcessing = true
    this.scanError = ''
    this.scanWarning = ''
    this.scanSuccess = ''
    this.scannedUser = null
    this.pointageService.verifierStatutByQR(scan.codeQR).subscribe({
      next: (res) => {
        this.displayScannedResult(res, false)
        if (res.statut !== 'vert' || !res.utilisateurId) {
          this.announceAttendance(this.scannedUser || {}, 'refuse')
          this.playBeepRefus()
          this.finishReaderScan()
          return
        }

        this.scanProcessingMessage = 'Identité confirmée. Enregistrement du pointage…'
        this.pointageService.pointerParQR(scan.codeQR).subscribe({
          next: (result) => {
            const pointage = result.pointage
            this.lastAttendanceName = this.formatPersonName(this.scannedUser)
            this.lastAttendanceRole = this.roleLabel(this.scannedUser?.role)
            this.lastAttendancePhotoUrl = this.scannedUser?.photoUrl || ''
            const heure = result.mode === 'passage'
              ? pointage.heureArrivee
              : (result.mode === 'depart' ? pointage.heureDepart : pointage.heureArrivee)
            this.announceAttendance(this.scannedUser, result.mode, heure || undefined)
            this.playBeepSucces()
            this.scanSuccess = result.mode === 'depart'
              ? 'Départ enregistré à ' + pointage.heureDepart
              : (result.mode === 'passage'
                ? 'Passage enregistré à ' + pointage.heureArrivee
                : 'Arrivée enregistrée à ' + pointage.heureArrivee)
            this.scannedUser = null
            this.finishReaderScan()
          },
          error: (err) => {
            this.scannedUser = null
            if (this.isDuplicateAttendanceError(err)) {
              this.scanWarning = err.error?.message || 'Arrivée et départ déjà pointées aujourd’hui. Aucun nouveau pointage n’a été ajouté.'
            } else {
              this.scanError = err.error?.message || 'Le pointage n’a pas pu être enregistré. Réessayez.'
              this.playBeepRefus()
            }
            this.finishReaderScan()
          }
        })
      },
      error: (err) => {
        this.scannedUser = null
        this.scanError = err.error?.message || 'Code QR invalide ou service de pointage indisponible.'
        this.playBeepRefus()
        this.finishReaderScan()
      }
    })
  }

  private finishReaderScan(): void {
    this.readerScanInProgress = false
    if (this.readerQueue.length > 0) {
      this.processNextReaderScan()
    } else {
      this.scanProcessing = false
      this.scanProcessingMessage = ''
    }
  }

  private playBeep(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()
      osc.connect(gain)
      gain.connect(this.audioCtx.destination)
      osc.type = 'sine'
      osc.frequency.value = 1200
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15)
      osc.start()
      osc.stop(this.audioCtx.currentTime + 0.15)
    } catch {}
    try {
      navigator.vibrate(150)
    } catch {}
  }

  private playTone(startTime: number, frequency: number, duration: number): void {
    const audioCtx = this.audioCtx
    if (!audioCtx) return
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  /** Succès : 2 bips brefs aigus (1568 Hz / G6) */
  private playBeepSucces(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }
      const now = this.audioCtx.currentTime
      this.playTone(now, 1568, 0.09)
      this.playTone(now + 0.12, 1568, 0.09)
    } catch {}
    try {
      navigator.vibrate(150)
    } catch {}
  }

  /** Refus / erreur : double-bip grave (2 x 392 Hz / G4, ~0,15 s, espacés ~0,12 s) */
  private playBeepRefus(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext()
      }
      const now = this.audioCtx.currentTime
      this.playTone(now, 392, 0.15)
      this.playTone(now + 0.27, 392, 0.15)
    } catch {}
    try {
      navigator.vibrate([150, 60, 150])
    } catch {}
  }

  private getCacheKey(codeQR: string): string {
    return 'scan_cache_' + codeQR
  }

  private getCachedResult(codeQR: string): any {
    try {
      const raw = sessionStorage.getItem(this.getCacheKey(codeQR))
      if (!raw) return null
      const data = JSON.parse(raw)
      if (Date.now() - data.timestamp < TerminalPointagePageComponent.CACHE_TTL_MS) {
        return data.result
      }
      sessionStorage.removeItem(this.getCacheKey(codeQR))
    } catch {}
    return null
  }

  private setCachedResult(codeQR: string, result: any): void {
    try {
      sessionStorage.setItem(this.getCacheKey(codeQR), JSON.stringify({
        result,
        timestamp: Date.now()
      }))
    } catch {}
  }

  private clearScanTimer(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer)
      this.scanTimer = null
    }
  }

  private loadTodayPointage(): void {
    this.loading = true
    this.loadError = ''
    this.pointageService.getToday().subscribe({
      next: (res) => {
        this.todayPointage = res
        this.loading = false
      },
      error: () => {
        this.loading = false
        this.loadError = 'Impossible de récupérer votre pointage. Réessayez.'
      }
    })
  }

  retryLoadTodayPointage(): void {
    this.loadTodayPointage()
  }

  pointerArrivee(): void {
    this.pointageService.pointerArrivee().subscribe({
      next: (res) => {
        this.todayPointage = res
        this.selfSuccess = 'Arrivée pointée à ' + res.heureArrivee
        this.playBeepSucces()
        setTimeout(() => this.selfSuccess = '', 4000)
      },
      error: (err) => {
        this.selfError = err.error?.message || 'Erreur lors du pointage'
        this.playBeepRefus()
        setTimeout(() => this.selfError = '', 4000)
      }
    })
  }

  pointerDepart(): void {
    this.pointageService.pointerDepart().subscribe({
      next: (res) => {
        this.todayPointage = res
        this.selfSuccess = 'Départ pointé à ' + res.heureDepart
        this.playBeepSucces()
        setTimeout(() => this.selfSuccess = '', 4000)
      },
      error: (err) => {
        this.selfError = err.error?.message || 'Erreur lors du pointage'
        this.playBeepRefus()
        setTimeout(() => this.selfError = '', 4000)
      }
    })
  }

  async startScanner(mode: 'arrivee' | 'depart'): Promise<void> {
    this.scanMode = mode
    this.scannedUser = null
    this.scanError = ''
    this.scanWarning = ''
    this.scanSuccess = ''
    this.scanTimeout = false
    this.showManualInput = false
    await this.stopScanner()
    this.scanning = true

    // Laisse Angular afficher le <div id="qr-reader-pointage"> (ngIf)
    // avant d'y attacher le lecteur, sinon l'élément n'existe pas encore.
    await new Promise((resolve) => setTimeout(resolve, 60))
    if (!document.getElementById('qr-reader-pointage')) {
      this.scanError = 'Zone de scan introuvable, réessayez'
      this.scanning = false
      return
    }

    this.clearScanTimer()
    this.scanTimer = setTimeout(() => {
      void this.stopScanner()
      this.scanTimeout = true
    }, TerminalPointagePageComponent.SCAN_TIMEOUT_MS)

    try {
      this.html5QrCode = new Html5Qrcode('qr-reader-pointage', { verbose: false })
    } catch {
      this.clearScanTimer()
      this.scanError = 'Initialisation du scanner impossible'
      this.scanning = false
      return
    }

    // Choix de la caméra : arrière si disponible, sinon la première.
    // `facingMode: environment` seul échoue sur les PC (une seule webcam
    // frontale) ou ouvre un flux basse résolution qui ne décode jamais.
    let cameraConfig: any = { facingMode: 'environment' }
    try {
      const cameras = await Html5Qrcode.getCameras()
      if (!cameras || cameras.length === 0) {
        throw new Error('no-camera')
      }
      const back = cameras.find((c) => /back|rear|environment|arrière/i.test(c.label))
      cameraConfig = { deviceId: { exact: (back || cameras[0]).id } }
    } catch {
      // getCameras peut échouer sans permission : on garde facingMode,
      // le navigateur demandera l'autorisation au start().
    }

    const qrboxFn = (w: number, h: number) => {
      // Grande boîte (85 % du viseur) : les QR denses CARTE|v=1|…
      // (~110 caractères) exigent beaucoup de pixels pour se décoder.
      const s = Math.floor(Math.min(w, h) * 0.85)
      const size = Math.max(200, Math.min(480, s))
      return { width: size, height: size }
    }
    const startWith = (cam: any, cfg: any) => this.html5QrCode!.start(
      cam,
      cfg,
      (decodedText) => this.onScanSuccess(decodedText),
      () => { /* pas de QR dans cette frame : normal, on ignore */ }
    )
    try {
      try {
        await startWith(cameraConfig, {
          // 30 tentatives/seconde : un QR flou sur une frame peut être
          // net sur la suivante (micro-mouvements de la main).
          fps: 30,
          qrbox: qrboxFn,
          aspectRatio: 1.0,
          // Flux HD : sans pixels, aucun décodeur ne lit un QR dense.
          videoConstraints: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            focusMode: 'continuous'
          },
          disableFlip: false,
          rememberLastUsedCamera: true,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false
        } as any)
      } catch (firstErr: any) {
        // Certaines webcams/Edge rejettent les contraintes HD (Overconstrained)
        // : on relance en mode simple, le navigateur choisit son flux natif.
        const retriable = ['OverconstrainedError', 'NotFoundError', 'NotReadableError'].includes(firstErr?.name)
          || /overconstrained|not found|constraint/i.test(firstErr?.message || '')
        if (!retriable) throw firstErr
        console.warn('[Pointage] contraintes HD rejetées, relance en mode simple', firstErr)
        await startWith({ facingMode: 'environment' }, {
          fps: 20,
          qrbox: qrboxFn,
          disableFlip: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false
        } as any)
      }
      // Diagnostic : moteur utilisé + résolution réelle du flux.
      // Si le flux reste en 640x480 malgré la demande HD, aucun QR dense
      // ne passera : il faudra forcer la HD ou changer de capteur.
      this.decoderNatif = 'BarcodeDetector' in window
      try {
        const settings: any = this.html5QrCode.getRunningTrackSettings?.()
        if (settings?.width && settings?.height) {
          this.streamRes = settings.width + 'x' + settings.height
        }
      } catch { /* ignore */ }
      // Autofocus + exposition en continu : indispensable, une mise au point
      // figée sur l'infini rend tout QR flou de près. Non bloquant.
      try {
        await this.html5QrCode.applyVideoConstraints({
          advanced: [{ focusMode: 'continuous', exposureMode: 'continuous' }]
        } as any)
      } catch { /* capteur sans contrôle */ }
      try {
        const camCaps: any = this.html5QrCode.getRunningTrackCameraCapabilities?.()
        try {
          const zoom = camCaps?.zoomFeature?.()
          if (zoom?.isSupported?.()) {
            this.zoomMin = zoom.min()
            this.zoomMax = zoom.max()
            this.zoomStep = zoom.step() || 0.1
            this.zoomValue = this.zoomMin
            this.zoomSupported = this.zoomMax > this.zoomMin
          }
        } catch { /* zoom indisponible */ }
        try {
          this.torchSupported = camCaps?.torchFeature?.()?.isSupported?.() === true
        } catch {
          this.torchSupported = false
        }
        if (!this.torchSupported) {
          try {
            const caps: any = this.html5QrCode.getRunningTrackCapabilities?.() || {}
            this.torchSupported = caps?.torch === true
          } catch {
            this.torchSupported = false
          }
        }
      } catch {
        this.torchSupported = false
        this.zoomSupported = false
      }
    } catch (err: any) {
      this.clearScanTimer()
      this.scanning = false
      console.error('[Pointage] démarrage caméra impossible', err)
      const name: string = err?.name || ''
      const msg: string = err?.message || ''
      if (name === 'NotAllowedError' || /permission|denied/i.test(msg)) {
        this.scanError = 'Caméra refusée : autorisez l\'accès dans le navigateur (icône caméra dans la barre d\'adresse)'
      } else if (name === 'NotFoundError' || /no-camera/i.test(msg)) {
        this.scanError = 'Aucune caméra détectée sur cet appareil'
      } else if (name === 'NotReadableError' || /busy|in use/i.test(msg)) {
        this.scanError = 'Caméra déjà utilisée par une autre application (visio, Teams…) : fermez-la puis réessayez'
      } else if (name === 'OverconstrainedError' || /overconstrained/i.test(msg)) {
        this.scanError = 'Caméra incompatible avec ce mode : réessayez, le navigateur choisira un autre capteur'
      } else {
        this.scanError = 'Impossible de démarrer la caméra' + (msg ? ' : ' + msg : '')
      }
      try {
        await this.html5QrCode?.clear()
      } catch { /* ignore */ }
      this.html5QrCode = null
    }
  }

  /** Allume/éteint la lampe du téléphone (salles sombres, QR peu contrastés). */
  async toggleTorch(): Promise<void> {
    if (!this.html5QrCode || !this.torchSupported) return
    this.torchOn = !this.torchOn
    try {
      await this.html5QrCode.applyVideoConstraints({ advanced: [{ torch: this.torchOn }] } as any)
    } catch {
      this.torchOn = !this.torchOn
    }
  }

  /** Zoom optique/numérique sur le QR (petits codes imprimés). */
  async setZoom(v: number): Promise<void> {
    if (!this.html5QrCode) return
    this.zoomValue = Number(v)
    try {
      await this.html5QrCode.applyVideoConstraints({ advanced: [{ zoom: this.zoomValue }] } as any)
    } catch { /* capteur sans zoom */ }
  }

  async stopScanner(): Promise<void> {
    this.clearScanTimer()
    this.torchOn = false
    this.torchSupported = false
    this.zoomSupported = false
    this.zoomValue = this.zoomMin
    this.streamRes = ''
    if (this.html5QrCode) {
      const reader = this.html5QrCode
      this.html5QrCode = null
      try {
        await reader.stop()
      } catch { /* déjà arrêté ou jamais démarré */ }
      try {
        await reader.clear()
      } catch { /* ignore */ }
    }
    this.scanning = false
  }

  /** Secours : décoder un QR depuis une photo (diagnostique caméra vs décodeur). */
  async scannerDepuisImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input?.files?.[0]
    input.value = ''
    if (!file) return
    this.scanError = ''
    this.scanWarning = ''
    const reader = new Html5Qrcode('qr-reader-pointage')
    try {
      const decoded = await reader.scanFile(file, false)
      this.onScanSuccess(decoded)
    } catch {
      this.scanError = 'QR illisible sur cette image : rapprochez-vous, éclairez le code et évitez les reflets'
    } finally {
      try {
        await reader.clear()
      } catch { /* ignore */ }
    }
  }

  private onScanSuccess(decodedText: string): void {
    this.scannedCodeQR = decodedText.trim()
    this.playBeep()
    void this.stopScanner()
    const cached = this.getCachedResult(decodedText)
    if (cached) {
      this.displayScannedResult(cached)
      return
    }
    this.verifierStatut(decodedText)
  }

  private displayScannedResult(res: any, playFeedback: boolean = true): void {
    const autorise = res.statut === 'vert'
    if (playFeedback && !autorise) {
      this.playBeepRefus()
    } else if (playFeedback) {
      // Bip : 1 si à jour, 2 si pas à jour
      const estAJour = res.situationFinanciere?.estAJour !== false
      if (estAJour) {
        this.playBeepSucces()
      } else {
        this.playBeepRefus()
      }
    }
    this.scannedUser = {
      userId: res.utilisateurId,
      matricule: res.matricule || '',
      nom: res.nom || 'Inconnu',
      prenoms: res.prenoms || '',
      role: res.role || 'apprenant',
      statut: autorise ? 'vert' : 'rouge',
      message: res.message || (autorise ? 'Accès autorisé' : 'Accès refusé'),
      photo: res.photo || '',
      photoUrl: this.buildPhotoUrl(res.photo, res.photoType),
      situationFinanciere: res.situationFinanciere || null
    }
  }

  private buildPhotoUrl(photo?: string | null, photoType?: string): string {
    if (!photo) return ''
    const photoBase = photoType === 'enseignant'
      ? this.TEACHER_PHOTOS_PATH
      : photoType === 'profile'
        ? this.PROFILE_PHOTOS_PATH
        : this.PHOTOS_PATH
    return photoBase + encodeURIComponent(photo)
  }

  photoPointageIndisponible(): void {
    this.lastAttendancePhotoUrl = ''
  }

  photoIndisponible(): void {
    if (this.scannedUser) this.scannedUser.photoUrl = ''
  }

  verifierParIdManuel(): void {
    if (!this.manualId.trim()) return
    this.scannedCodeQR = null
    this.verifierStatut(this.manualId.trim())
    this.showManualInput = false
  }

  private verifierStatut(codeQR: string): void {
    this.scannedUser = null
    this.scanError = ''
    this.scanWarning = ''
    this.scanSuccess = ''
    this.pointageService.verifierStatutByQR(codeQR).subscribe({
      next: (res) => {
        this.setCachedResult(codeQR, res)
        this.displayScannedResult(res)
      },
      error: (err) => {
        this.scanError = err.error?.message || 'Utilisateur non trouvé'
        this.playBeepRefus()
      }
    })
  }

  pointerScannedUser(mode: 'arrivee' | 'depart'): void {
    if (!this.scannedUser?.userId) return
    const codeQR = this.scannedCodeQR
    let actualMode: 'arrivee' | 'depart' | 'passage' = mode
    const serviceCall = codeQR?.startsWith('CARTE|v=1|')
      ? this.pointageService.pointerParQR(codeQR).pipe(map((response) => {
        actualMode = response.mode
        return response.pointage
      }))
      : mode === 'arrivee'
        ? this.pointageService.pointerArriveeByScan(this.scannedUser.userId)
        : this.pointageService.pointerDepartByScan(this.scannedUser.userId)

    serviceCall.subscribe({
      next: (res: Pointage) => {
        this.lastAttendanceName = this.formatPersonName(this.scannedUser)
        this.lastAttendanceRole = this.roleLabel(this.scannedUser?.role)
        this.lastAttendancePhotoUrl = this.scannedUser?.photoUrl || ''
        const heure = actualMode === 'depart' ? res.heureDepart : res.heureArrivee
        this.announceAttendance(this.scannedUser, actualMode, heure || undefined)
        this.playBeepSucces()
        this.scanSuccess = actualMode === 'depart'
          ? 'Départ pointé à ' + res.heureDepart
          : (actualMode === 'passage'
            ? 'Passage enregistré à ' + res.heureArrivee
            : 'Arrivée pointée à ' + res.heureArrivee)
        this.scannedUser = null
        this.scannedCodeQR = null
        setTimeout(() => this.scanSuccess = '', 4000)
      },
      error: (err) => {
        if (this.isDuplicateAttendanceError(err)) {
          this.scanWarning = err.error?.message || (mode === 'arrivee'
            ? 'Arrivée déjà pointée aujourd\'hui'
            : 'Départ déjà pointé aujourd\'hui')
        } else {
          this.scanError = err.error?.message || 'Erreur lors du pointage'
          this.playBeepRefus()
        }
        this.scannedUser = null
        this.scannedCodeQR = null
        setTimeout(() => {
          this.scanError = ''
          this.scanWarning = ''
        }, 4000)
      }
    })
  }

  private isDuplicateAttendanceError(err: any): boolean {
    return err.error?.alreadyExists === true || err.error?.code === 'ALREADY_EXISTS'
  }

  resetScan(): void {
    this.scannedUser = null
    this.scanError = ''
    this.scanWarning = ''
    this.scanSuccess = ''
    this.scanTimeout = false
    this.manualId = ''
    this.showManualInput = false
    this.scannedCodeQR = null
  }

  toggleVoiceAnnouncements(): void {
    this.voiceAnnouncementsEnabled = !this.voiceAnnouncementsEnabled
    this.voiceError = ''
    if (!this.voiceAnnouncementsEnabled
      && typeof window !== 'undefined'
      && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  testVoiceAnnouncement(): void {
    if (!this.voiceAnnouncementsEnabled) return
    this.speak('ESA, le label des diplômes de qualité')
  }

  private announceAttendance(user: any, mode: 'arrivee' | 'depart' | 'passage' | 'refuse', time?: string): void {
    if (!this.voiceAnnouncementsEnabled) return
    const prenom = (user?.prenoms || '').trim() || this.formatPersonName(user)
    const nomComplet = this.formatPersonName(user)
    const heure = this.formatHeureCourte(time)
    const estApprenant = String(user?.role || '').toLowerCase() === 'apprenant'

    if (mode === 'refuse') {
      this.speak('Accès refusé. Veuillez vous adresser à l’administration.')
      return
    }

    if (estApprenant) {
      this.speak(`${nomComplet}. Passage enregistré${heure ? ' à ' + heure : ''}.`)
      return
    }

    if (mode === 'depart') {
      this.speak(`Au revoir ${prenom}. Départ${heure ? ' à ' + heure : ''}.`)
      return
    }

    this.speak(`Bonjour ${prenom}. Bonne arrivée${heure ? ' à ' + heure : ''}.`)
  }

  private formatHeureCourte(time?: string): string {
    if (!time) return ''
    const match = String(time).match(/^(\d{2}):(\d{2})/)
    return match ? `${match[1]}:${match[2]}` : ''
  }

  private speak(text: string): void {
    if (!this.voiceAnnouncementsEnabled) return
    if (typeof window === 'undefined'
      || !('speechSynthesis' in window)
      || typeof SpeechSynthesisUtterance === 'undefined') {
      this.voiceError = 'La synthèse vocale n’est pas disponible dans ce navigateur.'
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.95
    utterance.onstart = () => { this.voiceError = '' }
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && this.voiceAnnouncementsEnabled) {
        this.voiceError = 'La lecture vocale a échoué. Vérifiez le volume ou désactivez la voix.'
      }
    }

    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch {
      this.voiceError = 'Impossible de lancer la lecture vocale dans ce navigateur.'
    }
  }

  private formatPersonName(user: any): string {
    return [user?.prenoms, user?.nom].filter((part) => typeof part === 'string' && part.trim()).join(' ').trim()
      || 'Personne identifiée'
  }

  private roleLabel(role: string | undefined): string {
    const labels: { [key: string]: string } = {
      apprenant: 'Étudiant autorisé',
      enseignant: 'Enseignant autorisé',
      personnel_administratif: 'Personnel administratif autorisé',
      institution: 'Personnel de l’établissement autorisé',
      admin: 'Administrateur autorisé',
      ressources_humaines: 'Personnel des ressources humaines autorisé',
      surveillant: 'Surveillant autorisé',
      secretaire: 'Secrétaire autorisé',
      caissier_banque: 'Caissier autorisé',
      superviseur_general: 'Superviseur général autorisé',
      cabinet_comptable: 'Personnel comptable autorisé',
      comite_orientation: 'Membre du comité d’orientation autorisé',
      esa_compta: 'Personnel comptable autorisé'
    }
    return role ? labels[role.toLowerCase()] || 'Personnel autorisé' : 'Personne autorisée'
  }

  formatCurrency(value: number | undefined | null): string {
    if (value == null) return '—'
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
  }

  libelleMois(mois: string | undefined | null): string {
    if (!mois) return '—'
    const m = String(mois).match(/^(\d{4})-(\d{2})$/)
    if (!m) return String(mois)
    const noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    const nom = noms[Number(m[2]) - 1]
    return nom ? `${nom} ${m[1]}` : String(mois)
  }
}
