import { Component, Input, OnInit } from '@angular/core';
import { AnneesParcours } from 'src/app/data/enums/AnneesParcours';
import { EtatsCoursChoisi } from 'src/app/data/enums/EtatsCoursChoisi';
import { EtatsValidationParcours } from 'src/app/data/enums/EtatsValidationParcours';
import { SemestresParcours } from 'src/app/data/enums/SemestresParcours';
import { TypesPaiement } from 'src/app/data/enums/TypesPaiement';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { DemandeInscriptionCours } from 'src/app/data/modules/inscription/models/DemandeInscriptionCours.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';
import { RolesValueType } from 'src/app/data/types/RolesValueType';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-validation-section',
  templateUrl: './validation-section.component.html',
  styleUrls: ['./validation-section.component.scss']
})
export class ValidationSectionComponent implements OnInit {

  @Input() demande!: DemandeInscription
  @Input() parcours?: Parcours
  @Input() coursChoisis?: DemandeInscriptionCours[]
  @Input() rolesValue!: RolesValueType

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  readonly etatsValidationParcours = EtatsValidationParcours
  readonly anneesParcours = AnneesParcours
  readonly semestresParcours = SemestresParcours
  readonly typesPaiement = TypesPaiement
  readonly etatsCoursChoisi = EtatsCoursChoisi

  choixParcoursFinal?: string
  
  constructor() { }

  ngOnInit(): void {
    if(this.parcours) {
      this.choixParcoursFinal = this.demande!.parcoursChoisis!.find(value => value.parcours!.id == this.parcours!.id)?.id
      console.log(this.parcours, this.choixParcoursFinal)
    }
  }

  getFraisPayes(): number {
    return this.demande!.paiementsInscription?.reduce((accumulator, currentValue) => {
      return accumulator + (currentValue.montant ?? 0)
    }, 0) as number
  }

  getEtatCoursChoisi(coursId: string): EtatsCoursChoisi {
    const coursChoisi: DemandeInscriptionCours | undefined = this.coursChoisis?.find(coursChoisi => coursChoisi.coursId == coursId)

    if (coursChoisi != undefined) {
      return coursChoisi.etat!
    }
    return EtatsCoursChoisi.ENCOURS
  }

  checkDossier(dossierId: string): boolean {
    return this.demande.dossiersDemande!.find(value => value.dossierId == dossierId) != undefined
  }

}
