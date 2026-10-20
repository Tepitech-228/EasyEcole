import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';
import { AuthService, SiteUtilisateur } from 'src/app/data/modules/auth/services/auth.service';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { JwtTokenService } from 'src/app/core/services/jwt-token.service';

@Component({
  selector: 'app-liste-enseignants-page',
  templateUrl: './liste-enseignants-page.component.html',
  styleUrls: ['./liste-enseignants-page.component.scss']
})
export class ListeEnseignantsPageComponent extends BaseComponentClass implements OnInit {

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS_ENSEIGNANTS
  readonly QR_CODES_PATH: string = environment.QR_CODES_ENSEIGNANTS_PATH
  showNouvelEnseignantModal: boolean = false
  successMessage: string | null = null
  errorMessage: string | null = null

  enseignants: Enseignant[] = []
  sitesDisponibles: SiteUtilisateur[] = []
  sitesLoading = false
  sitesError = ''
  selectedPhoto: File | null = null
  photoPreviewUrl: string | null = null

  enseignantForm: FormGroup = new FormGroup({
    identifiant: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    nom: new FormControl(null, [Validators.required]),
    prenoms: new FormControl(null, [Validators.required]),
    contact: new FormControl(null, [Validators.required]),
    etablissementId: new FormControl(null, [Validators.required]),
    cni: new FormControl(null),
    sexe: new FormControl(null),
    dateNaissance: new FormControl(null),
    nationalite: new FormControl(null),
    plusHautDiplome: new FormControl(null),
    gradeAcademique: new FormControl(null),
    statut: new FormControl(null),
    specialite: new FormControl(null),
    heureTheoriqueAnnuelle: new FormControl(null),
    heureReelleAnnuelle: new FormControl(null),
    fonctionAdministrative: new FormControl(null),
    statutHandicap: new FormControl(null),
    natureHandicap: new FormControl(null),
    anneeExperience: new FormControl(null),
    nifOtr: new FormControl(null),
  })

  constructor(
    private router: Router,
    private authService: AuthService,
    private enseignantService: EnseignantService,
    private localStorageService: LocalStorageService,
    private registrationJwtService: JwtTokenService) {
    super()
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
      this.router.navigate(['/'])
    }
    else {
      this.getEnseignants()
    }
  }

  ngOnInit(): void {
    this.chargerSites()
  }

  private chargerSites(): void {
    this.sitesLoading = true
    this.authService.getSitesMoi().subscribe({
      next: sites => {
        this.sitesDisponibles = sites
        const token = this.localStorageService.get(LocalStorageService.AUTH_TOKEN)
        if (token) {
          this.registrationJwtService.setToken(token)
          const tokenData = this.registrationJwtService.getDecodeToken() as { etablissementId?: string | number }
          const activeSiteId = Number(tokenData?.etablissementId)
          if (sites.some(site => Number(site.id) === activeSiteId)) {
            this.enseignantForm.patchValue({ etablissementId: activeSiteId })
          }
        }
        if (!this.enseignantForm.get('etablissementId')!.value && sites.length === 1) {
          this.enseignantForm.patchValue({ etablissementId: sites[0].id })
        }
        this.sitesLoading = false
      },
      error: () => {
        this.sitesError = 'Les sites autorisés n’ont pas pu être chargés.'
        this.sitesLoading = false
      }
    })
  }

  private getEnseignants(): void {
    this.enseignantService.getAll()
      .subscribe(
        {
          next: (res) => {
            this.enseignants = res
          },
          error: (err) => {
            console.log(err)
          },
        }
      )
  }

  ajouterEnseignant(): void {
    this.enseignantForm.markAllAsTouched()
    if (!this.selectedPhoto) {
      this.errorMessage = 'La photo du profil est obligatoire pour créer un enseignant et préparer son enrôlement au pointage.'
      return
    }
    const selectedSiteId = Number(this.enseignantForm.get('etablissementId')!.value)
    if (
      this.enseignantForm.valid &&
      !this.sitesLoading &&
      this.sitesDisponibles.some(site => Number(site.id) === selectedSiteId)
    ) {
      this.successMessage = null
      this.errorMessage = null
      let enseignant: Enseignant = new Enseignant()
      enseignant.utilisateur = new Utilisateur()
      enseignant.utilisateur.identifiant = this.enseignantForm.get('identifiant')!.value
      enseignant.utilisateur.email = this.enseignantForm.get('email')!.value
      enseignant.utilisateur.nom = this.enseignantForm.get('nom')!.value ?? new Date()
      enseignant.utilisateur.prenoms = this.enseignantForm.get('prenoms')!.value
      enseignant.utilisateur.contact = this.enseignantForm.get('contact')!.value

      enseignant.etablissementId = selectedSiteId
      enseignant.cni = this.enseignantForm.get('cni')!.value ?? null
      // Matricule auto-généré côté backend (badge + QR) — plus de saisie manuelle
      enseignant.sexe = this.enseignantForm.get('sexe')!.value || null
      enseignant.dateNaissance = this.enseignantForm.get('dateNaissance')!.value ?? null
      enseignant.nationalite = this.enseignantForm.get('nationalite')!.value ?? null
      enseignant.plusHautDiplome = this.enseignantForm.get('plusHautDiplome')!.value ?? null
      enseignant.gradeAcademique = this.enseignantForm.get('gradeAcademique')!.value ?? null
      enseignant.statut = this.enseignantForm.get('statut')!.value ?? null
      enseignant.specialite = this.enseignantForm.get('specialite')!.value ?? null
      enseignant.heureTheoriqueAnnuelle = this.enseignantForm.get('heureTheoriqueAnnuelle')!.value !== '' && this.enseignantForm.get('heureTheoriqueAnnuelle')!.value != null ? Number(this.enseignantForm.get('heureTheoriqueAnnuelle')!.value) : undefined
      enseignant.heureReelleAnnuelle = this.enseignantForm.get('heureReelleAnnuelle')!.value !== '' && this.enseignantForm.get('heureReelleAnnuelle')!.value != null ? Number(this.enseignantForm.get('heureReelleAnnuelle')!.value) : undefined
      enseignant.fonctionAdministrative = this.enseignantForm.get('fonctionAdministrative')!.value ?? null
      enseignant.statutHandicap = this.enseignantForm.get('statutHandicap')!.value === true || this.enseignantForm.get('statutHandicap')!.value === 'true' ? true : false
      enseignant.natureHandicap = this.enseignantForm.get('natureHandicap')!.value ?? null
      enseignant.anneeExperience = this.enseignantForm.get('anneeExperience')!.value !== '' && this.enseignantForm.get('anneeExperience')!.value != null ? Number(this.enseignantForm.get('anneeExperience')!.value) : undefined
      enseignant.nifOtr = this.enseignantForm.get('nifOtr')!.value ?? null

      this.authService.registerEnseignant(enseignant).subscribe({
        next: (res: { matricule?: string; qrCode?: string; enseignantId?: string }) => {
          if (this.selectedPhoto && res.enseignantId) {
            this.enseignantService.updatePhotoById(res.enseignantId, this.selectedPhoto).subscribe({
              next: (uploadResult: { enrollmentQueued?: boolean }) =>
                this.finaliserCreation(res.matricule, false, uploadResult.enrollmentQueued),
              error: () => this.finaliserCreation(res.matricule, true),
            })
          } else {
            this.finaliserCreation(res.matricule)
          }
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || "Impossible de créer l'enseignant et son badge."
        },
      })
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files && input.files[0]
    if (!file) return
    this.selectedPhoto = file
    const reader = new FileReader()
    reader.onload = () => { this.photoPreviewUrl = reader.result as string }
    reader.readAsDataURL(file)
  }

  private finaliserCreation(matricule?: string, photoEchec: boolean = false, enrollmentQueued?: boolean): void {
    if (photoEchec) {
      this.errorMessage = `Le compte enseignant a été créé${matricule ? ` (matricule : ${matricule})` : ''}, mais sa photo n’a pas pu être enregistrée. Ajoutez-la depuis sa fiche avant le pointage facial.`
      this.successMessage = null
      this.getEnseignants()
      this.closeNouvelEnseignantModal()
      return
    }
    this.successMessage = matricule
      ? `Enseignant créé. Matricule : ${matricule}. Son QR code est lié à son compte et sa photo est enregistrée.` +
        (enrollmentQueued === true
          ? ' Son profil facial est en attente d’envoi au terminal.'
          : ' Aucun terminal Hikvision actif sur ses sites : l’enrôlement sera préparé à son ajout.')
      : 'Enseignant créé avec son matricule et son QR code liés à son compte.'
    this.getEnseignants()
    this.closeNouvelEnseignantModal()
  }

  // Modals
  openNouvelEnseignantModal(): void {
    this.showNouvelEnseignantModal = true
  }
  closeNouvelEnseignantModal(): void {
    this.showNouvelEnseignantModal = false
    const selectedSiteId = this.enseignantForm.get('etablissementId')!.value
    this.enseignantForm.reset()
    this.enseignantForm.patchValue({
      etablissementId: selectedSiteId || (this.sitesDisponibles.length === 1 ? this.sitesDisponibles[0].id : null)
    })
    this.selectedPhoto = null
    this.photoPreviewUrl = null
  }

}
