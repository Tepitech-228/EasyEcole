import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TypesMedia } from 'src/app/data/enums/TypesMedia';
import { FichierRessourceType } from 'src/app/data/types/FichierRessourceType';

@Component({
  selector: 'app-ajout-fichier-ressource',
  templateUrl: './ajout-fichier-ressource.component.html',
  styleUrls: ['./ajout-fichier-ressource.component.scss']
})
export class AjoutFichierRessourceComponent implements OnInit {

  file: File | undefined

  @Input() showFichierRessourceModal: boolean = false
  @Output() onAdd: EventEmitter<any> = new EventEmitter()
  @Output() onClose: EventEmitter<any> = new EventEmitter()

  readonly typesMedia = TypesMedia

  nouveauFichierRessourceForm: FormGroup = new FormGroup({
    fichier: new FormControl(null, [Validators.required]),
    titre: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
  })

  constructor() { }

  ngOnInit(): void {
  }

  onFichierChange(event: any) {
    console.log(event);
    
    this.file = event
    this.nouveauFichierRessourceForm.get('fichier')?.setValue(event)
    if(event != null) {
      // if(this.nouveauFichierRessourceForm.get('titre')!.value == '' || this.nouveauFichierRessourceForm.get('titre')!.value == undefined) {
      this.nouveauFichierRessourceForm.get('titre')?.setValue(event.name)
      // }
    }
    else {
      this.nouveauFichierRessourceForm.reset()
    }
  }

  ajouterFichierRessource(): void {
    this.nouveauFichierRessourceForm.markAllAsTouched()

    if (this.nouveauFichierRessourceForm.valid) {
      let fichierRessource: FichierRessourceType = {
        titre: this.nouveauFichierRessourceForm.get('titre')!.value,
        description: this.nouveauFichierRessourceForm.get('description')!.value,
        fichier: this.file ?? this.nouveauFichierRessourceForm.get('fichier')!.value,
      }
      console.log(fichierRessource)
      this.onAdd.emit(fichierRessource)

      this.closeModal()
    }
  }

  closeModal(): void {
    this.file = undefined
    this.nouveauFichierRessourceForm.reset()
    this.showFichierRessourceModal = false
    this.onClose.emit()
  }

}
