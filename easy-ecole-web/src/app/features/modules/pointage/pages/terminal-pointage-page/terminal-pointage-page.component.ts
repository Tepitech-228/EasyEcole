import { Component, OnDestroy } from '@angular/core';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';
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
  scanMode: 'arrivee' | 'depart' = 'arrivee'
  scannedUser: any = null
  scanError: string = ''
  scanSuccess: string = ''
  scanTimeout: boolean = false
  selfSuccess: string = ''
  selfError: string = ''
  manualId: string = ''
  showManualInput: boolean = false
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
  private scanTimer: any = null
  private static readonly SCAN_TIMEOUT_MS = 30000
  private static readonly CACHE_TTL_MS = 60000
  private audioCtx: AudioContext | null = null

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly TEACHER_PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS_ENSEIGNANTS
  readonly PROFILE_PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PROFILES

  constructor(private pointageService: PointageService) {
    super()
    this.loadTodayPointage()
  }

  ngOnDestroy(): void {
    this.stopScanner()
    this.clearScanTimer()
    if (this.audioCtx) {
      this.audioCtx.close()
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
    const raw = sessionStorage.getItem(this.getCacheKey(codeQR))
    if (!raw) return null
    try {
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
    this.playBeep()
    void this.stopScanner()
    const cached = this.getCachedResult(decodedText)
    if (cached) {
      this.displayScannedResult(cached)
      return
    }
    this.verifierStatut(decodedText)
  }

  private displayScannedResult(res: any): void {
    const autorise = res.statut !== 'rouge'
    if (!autorise) {
      this.playBeepRefus()
    } else {
      // Bip : 1 si à jour, 2 si pas à jour
      const estAJour = res.situationFinanciere?.estAJour !== false
      if (estAJour) {
        this.playBeepSucces()
      } else {
        this.playBeepRefus()
      }
    }
    const photoBase = res.photoType === 'enseignant'
      ? this.TEACHER_PHOTOS_PATH
      : res.photoType === 'profile'
        ? this.PROFILE_PHOTOS_PATH
        : this.PHOTOS_PATH
    this.scannedUser = {
      userId: res.utilisateurId,
      matricule: res.matricule || '',
      nom: res.nom || 'Inconnu',
      prenoms: res.prenoms || '',
      role: res.role || 'apprenant',
      statut: autorise ? 'vert' : 'rouge',
      message: res.message || (autorise ? 'Accès autorisé' : 'Accès refusé'),
      photo: res.photo || '',
      photoUrl: res.photo ? photoBase + encodeURIComponent(res.photo) : '',
      situationFinanciere: res.situationFinanciere || null
    }
  }

  photoIndisponible(): void {
    if (this.scannedUser) this.scannedUser.photoUrl = ''
  }

  verifierParIdManuel(): void {
    if (!this.manualId.trim()) return
    this.verifierStatut(this.manualId.trim())
    this.showManualInput = false
  }

  private verifierStatut(codeQR: string): void {
    this.scannedUser = null
    this.scanError = ''
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
    const serviceCall = mode === 'arrivee'
      ? this.pointageService.pointerArriveeByScan(this.scannedUser.userId)
      : this.pointageService.pointerDepartByScan(this.scannedUser.userId)

    serviceCall.subscribe({
      next: (res) => {
        this.playBeepSucces()
        this.scanSuccess = mode === 'arrivee'
          ? 'Arrivée pointée à ' + res.heureArrivee
          : 'Départ pointé à ' + res.heureDepart
        this.scannedUser = null
        setTimeout(() => this.scanSuccess = '', 4000)
      },
      error: (err) => {
        this.playBeepRefus()
        if (err.error?.alreadyExists) {
          this.scanError = mode === 'arrivee'
            ? 'Arrivée déjà pointée aujourd\'hui'
            : 'Départ déjà pointé aujourd\'hui'
        } else {
          this.scanError = err.error?.message || 'Erreur lors du pointage'
        }
        setTimeout(() => this.scanError = '', 4000)
      }
    })
  }

  resetScan(): void {
    this.scannedUser = null
    this.scanError = ''
    this.scanSuccess = ''
    this.scanTimeout = false
    this.manualId = ''
    this.showManualInput = false
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
