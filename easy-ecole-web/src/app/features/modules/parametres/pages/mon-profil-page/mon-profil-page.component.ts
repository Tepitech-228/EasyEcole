import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EtatsPhysique } from 'src/app/data/enums/EtatsPhysique';
import { SituationsMatrimoniales } from 'src/app/data/enums/SituationsMatrimoniales';
import { Apprenant } from 'src/app/data/modules/auth/models/Apprenant.model';
import { CaissierBanque } from 'src/app/data/modules/auth/models/CaissierBanque.model';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { Institution } from 'src/app/data/modules/auth/models/Institution.model';
import { ApprenantService } from 'src/app/data/modules/auth/services/apprenant.service';
import { CaissierBanqueService } from 'src/app/data/modules/auth/services/caissier-banque.service';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';
import { InstitutionService } from 'src/app/data/modules/auth/services/institution.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-mon-profil-page',
  templateUrl: './mon-profil-page.component.html',
  styleUrls: ['./mon-profil-page.component.scss']
})
export class MonProfilPageComponent extends BaseComponentClass implements OnInit {

  /*TODO:: Select: ethnie, religion
           Disable les checboxs handicap, si etat physique valide
           Téléphone: custom validator
           Vos parents: informations non obligatoires si parent non vivant
  */
 
  imageURL?: string;
  file?: File

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly PHOTOS_ENSEIGNANTS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  updateError: boolean = false
  updateSuccess: boolean = false
  updatePhotoSuccess: boolean = false

  apprenant?: Apprenant
  institution?: Institution
  enseignant?: Enseignant
  caissier?: CaissierBanque
  profilForm!: FormGroup

  situationsMatrimoniales = SituationsMatrimoniales
  etatsPhysique = EtatsPhysique

  constructor(
    private apprenantService: ApprenantService,
    private institutionService: InstitutionService,
    private enseignantService: EnseignantService,
    private caissierBanqueService: CaissierBanqueService) {
    super()

    if(this.rolesValue.isApprenant) {
      this.getApprenant()
    }
    else if(this.rolesValue.isInstitution) {
      this.getInstitution()
    }
    else if(this.rolesValue.isEnseignant) {
      this.getEnseignant()
    }
    else if(this.rolesValue.isCaissierBanque) {
      this.getCaissierBanque()
    }
  }

  ngOnInit(): void {
  }

  private getApprenant(): void {
    this.apprenantService.get().subscribe({
      next: (value) => {
        console.log(value)
        this.apprenant = value ?? new Apprenant()
        this.initApprenantForm()
        this.supprimerFichier()
      },
      error: (err: HttpErrorResponse) => {
        console.log(err)
      }
    })
  }

  private getInstitution(): void {
    this.institutionService.get().subscribe({
      next: (value) => {
        console.log(value)
        this.institution = value ?? new Institution()
        this.initInstitutionForm()
      },
      error: (err: HttpErrorResponse) => {
        console.log(err)
      }
    })
  }

  private getEnseignant(): void {
    this.enseignantService.get().subscribe({
      next: (value) => {
        console.log(value)
        this.enseignant = value ?? new Enseignant()
        this.initEnseignantForm()
        this.supprimerFichier()
      },
      error: (err: HttpErrorResponse) => {
        console.log(err)
      }
    })
  }

  private getCaissierBanque(): void {
    this.caissierBanqueService.get().subscribe({
      next: (value) => {
        console.log(value)
        this.caissier = value ?? new CaissierBanque()
        this.initCaissierBanqueForm()
      },
      error: (err: HttpErrorResponse) => {
        console.log(err)
      }
    })
  }
  
  choisirFichier(): void {
    let input: HTMLInputElement = document.createElement('input');
    input.type = 'file';
    input.accept = "image/*"

    input.onchange = _ => {
      if (input.files) {
        let file: File | undefined = input.files[0]
        if (file) {
          this.file = file

          const reader = new FileReader();
          reader.onload = () => {
            this.imageURL = reader.result as string;
          }
          reader.readAsDataURL(file)
        }
      }
      else {
        console.log("Error")
      }
    };

    input.click();
  }

  supprimerFichier(): void {
    this.file = undefined
    this.imageURL = undefined
  }

  modifierPhotoProfil(): void {
    if(this.file) {
      this.apprenantService.updatePhoto(this.file).subscribe({
        next: (value) => {
          console.log()
          this.updatePhotoSuccess = true
          setTimeout(() => { this.updatePhotoSuccess = false }, 2000)
          this.getApprenant()
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          this.updateError = true
          setTimeout(() => { this.updateError = false }, 2000)
        }
      })
    }
  }

  modifierPhotoProfilEnseignant(): void {
    if(this.file) {
      this.enseignantService.updatePhoto(this.file).subscribe({
        next: (value) => {
          console.log()
          this.updatePhotoSuccess = true
          setTimeout(() => { this.updatePhotoSuccess = false }, 2000)
          this.getEnseignant()
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          this.updateError = true
          setTimeout(() => { this.updateError = false }, 2000)
        }
      })
    }
  }

  validerProfilApprenant(): void {
    this.profilForm.markAllAsTouched()
    console.log(this.profilForm.value as Apprenant)
    if (this.profilForm.valid) {
      this.apprenantService.update(this.profilForm.value as Apprenant).subscribe({
        next: (value) => {
          console.log()
          this.updateSuccess = true
          setTimeout(() => { this.updateSuccess = false }, 2000)
          this.getApprenant()
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          this.updateError = true
          setTimeout(() => { this.updateError = false }, 2000)
        }
      })
    }
  }

  validerProfilInstitution(): void {
    this.profilForm.markAllAsTouched()
    console.log(this.profilForm.value as Institution)
    if (this.profilForm.valid) {
      this.institutionService.update(this.profilForm.value as Institution).subscribe({
        next: (value) => {
          console.log()
          this.updateSuccess = true
          setTimeout(() => { this.updateSuccess = false }, 2000)
          this.getInstitution()
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          this.updateError = true
          setTimeout(() => { this.updateError = false }, 2000)
        }
      })
    }
  }

  validerProfilEnseignant(): void {
    this.profilForm.markAllAsTouched()
    console.log(this.profilForm.value as Apprenant)
    if (this.profilForm.valid) {
      this.enseignantService.update(this.profilForm.value as Enseignant).subscribe({
        next: (value) => {
          console.log()
          this.updateSuccess = true
          setTimeout(() => { this.updateSuccess = false }, 2000)
          this.getEnseignant()
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          this.updateError = true
          setTimeout(() => { this.updateError = false }, 2000)
        }
      })
    }
  }

  validerProfilCaissierBanque(): void {
    this.profilForm.markAllAsTouched()
    console.log(this.profilForm.value as CaissierBanque)
    if (this.profilForm.valid) {
      this.caissierBanqueService.update(this.profilForm.value as CaissierBanque).subscribe({
        next: (value) => {
          console.log()
          this.updateSuccess = true
          setTimeout(() => { this.updateSuccess = false }, 2000)
          this.getCaissierBanque()
        },
        error: (err: HttpErrorResponse) => {
          console.log(err)
          this.updateError = true
          setTimeout(() => { this.updateError = false }, 2000)
        }
      })
    }
  }

  initApprenantForm(): void {
    this.profilForm = new FormGroup({
      // photo: new FormControl(null, []),
      dateNaissance: new FormControl(this.apprenant?.dateNaissance ? this.apprenant?.dateNaissance.toString().split('T')[0] : null, [Validators.required]),
      lieuNaissance: new FormControl(this.apprenant?.lieuNaissance ?? null, [Validators.required]),
      identite: new FormGroup({
        nationalite: new FormControl(this.apprenant?.identite?.nationalite ?? null, [Validators.required]),
        ethnie: new FormControl(this.apprenant?.identite?.ethnie ?? null, []),
        prefecture: new FormControl(this.apprenant?.identite?.prefecture ?? null, []),
        religion: new FormControl(this.apprenant?.identite?.religion ?? null, []),
        situationMatrimoniale: new FormControl(this.apprenant?.identite?.situationMatrimoniale ?? this.situationsMatrimoniales.CELIBATAIRE, [Validators.required]),
        etatPhysique: new FormControl(this.apprenant?.identite?.etatPhysique ?? this.etatsPhysique.VALIDE, [Validators.required]),
        handicapMoteur: new FormControl(this.apprenant?.identite?.handicapMoteur ?? false, [Validators.required]),
        handicapVisuel: new FormControl(this.apprenant?.identite?.handicapVisuel ?? false, [Validators.required]),
        handicapAuditif: new FormControl(this.apprenant?.identite?.handicapAuditif ?? false, [Validators.required]),
      }),
      adresse: new FormGroup({
        boitePostale: new FormControl(this.apprenant?.adresse?.boitePostale ?? null, [Validators.required]),
        prorietaireBoitePostale: new FormControl(this.apprenant?.adresse?.prorietaireBoitePostale ?? null, [Validators.required]),
        telMobile: new FormControl(this.apprenant?.adresse?.telMobile ?? null, [Validators.required]),
        telDomicile: new FormControl(this.apprenant?.adresse?.telDomicile ?? null, []),
        quartier: new FormControl(this.apprenant?.adresse?.quartier ?? null, [Validators.required]),
        ville: new FormControl(this.apprenant?.adresse?.ville ?? null, [Validators.required]),
        pays: new FormControl(this.apprenant?.adresse?.pays ?? null, [Validators.required]),
      }),
      informationsSalarie: new FormGroup({
        estSalarie: new FormControl(this.apprenant?.informationsSalarie?.estSalarie ?? false, [Validators.required]),
        profession: new FormControl(this.apprenant?.informationsSalarie?.profession ?? null, []),
        entreprise: new FormControl(this.apprenant?.informationsSalarie?.entreprise ?? null, []),
      }),
      informationsParents: new FormGroup({
        pereVivant: new FormControl(this.apprenant?.informationsParents?.pereVivant ?? false, [Validators.required]),
        nomPrenomsPere: new FormControl(this.apprenant?.informationsParents?.nomPrenomsPere ?? null, [Validators.required]),
        professionPere: new FormControl(this.apprenant?.informationsParents?.professionPere ?? null, [Validators.required]),
        mereVivante: new FormControl(this.apprenant?.informationsParents?.mereVivante ?? false, [Validators.required]),
        nomPrenomsMere: new FormControl(this.apprenant?.informationsParents?.nomPrenomsMere ?? null, [Validators.required]),
        professionMere: new FormControl(this.apprenant?.informationsParents?.professionMere ?? null, [Validators.required]),
      }),
      personnePrevenir: new FormGroup({
        nom: new FormControl(this.apprenant?.personnePrevenir?.nom ?? null, [Validators.required]),
        prenoms: new FormControl(this.apprenant?.personnePrevenir?.prenoms ?? null, [Validators.required]),
        boitePostale: new FormControl(this.apprenant?.personnePrevenir?.boitePostale ?? null, []),
        email: new FormControl(this.apprenant?.personnePrevenir?.email ?? null, [Validators.email]),
        telMobile: new FormControl(this.apprenant?.personnePrevenir?.telMobile ?? null, [Validators.required]),
        telDomicile: new FormControl(this.apprenant?.personnePrevenir?.telDomicile ?? null, []),
        quartier: new FormControl(this.apprenant?.personnePrevenir?.quartier ?? null, [Validators.required]),
        ville: new FormControl(this.apprenant?.personnePrevenir?.ville ?? null, [Validators.required]),
        pays: new FormControl(this.apprenant?.personnePrevenir?.pays ?? null, [Validators.required]),
      }),
    })
  }

  initInstitutionForm(): void {
    this.profilForm = new FormGroup({
      dateNaissance: new FormControl(this.institution?.dateNaissance ? this.institution?.dateNaissance.toString().split('T')[0] : null),
      lieuNaissance: new FormControl(this.institution?.lieuNaissance ?? null),
      fonction: new FormControl(this.institution?.fonction ?? null),
      adresse: new FormGroup({
        boitePostale: new FormControl(this.institution?.adresse?.boitePostale ?? null),
        prorietaireBoitePostale: new FormControl(this.institution?.adresse?.prorietaireBoitePostale ?? null),
        telMobile: new FormControl(this.institution?.adresse?.telMobile ?? null),
        telDomicile: new FormControl(this.institution?.adresse?.telDomicile ?? null),
        quartier: new FormControl(this.institution?.adresse?.quartier ?? null),
        ville: new FormControl(this.institution?.adresse?.ville ?? null),
        pays: new FormControl(this.institution?.adresse?.pays ?? null),
      }),
    })
  }

  initEnseignantForm(): void {
    this.profilForm = new FormGroup({
      // photo: new FormControl(null, []),
      dateNaissance: new FormControl(this.enseignant?.dateNaissance ? this.enseignant?.dateNaissance.toString().split('T')[0] : null, [Validators.required]),
      lieuNaissance: new FormControl(this.enseignant?.lieuNaissance ?? null, [Validators.required]),
      fonction: new FormControl(this.enseignant?.fonction ?? null),
      adresse: new FormGroup({
        boitePostale: new FormControl(this.enseignant?.adresse?.boitePostale ?? null),
        prorietaireBoitePostale: new FormControl(this.enseignant?.adresse?.prorietaireBoitePostale ?? null),
        telMobile: new FormControl(this.enseignant?.adresse?.telMobile ?? null),
        telDomicile: new FormControl(this.enseignant?.adresse?.telDomicile ?? null),
        quartier: new FormControl(this.enseignant?.adresse?.quartier ?? null),
        ville: new FormControl(this.enseignant?.adresse?.ville ?? null),
        pays: new FormControl(this.enseignant?.adresse?.pays ?? null),
      }),
    })
  }

  initCaissierBanqueForm(): void {
    this.profilForm = new FormGroup({
      dateNaissance: new FormControl(this.caissier?.dateNaissance ? this.caissier?.dateNaissance.toString().split('T')[0] : null),
      lieuNaissance: new FormControl(this.caissier?.lieuNaissance ?? null),
      fonction: new FormControl(this.caissier?.fonction ?? null),
      adresse: new FormGroup({
        boitePostale: new FormControl(this.caissier?.adresse?.boitePostale ?? null),
        prorietaireBoitePostale: new FormControl(this.caissier?.adresse?.prorietaireBoitePostale ?? null),
        telMobile: new FormControl(this.caissier?.adresse?.telMobile ?? null),
        telDomicile: new FormControl(this.caissier?.adresse?.telDomicile ?? null),
        quartier: new FormControl(this.caissier?.adresse?.quartier ?? null),
        ville: new FormControl(this.caissier?.adresse?.ville ?? null),
        pays: new FormControl(this.caissier?.adresse?.pays ?? null),
      }),
    })
  }

}
