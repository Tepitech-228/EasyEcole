import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DeboucheParcoursType } from 'src/app/data/types/DeboucheParcoursType';

@Component({
  selector: 'app-ajout-debouche',
  templateUrl: './ajout-debouche.component.html',
  styleUrls: ['./ajout-debouche.component.scss']
})
export class AjoutDeboucheComponent implements OnInit {

  file: File | undefined

  @Input() showDebouchesModal: boolean = false
  @Output() onAdd: EventEmitter<any> = new EventEmitter()
  @Output() onClose: EventEmitter<any> = new EventEmitter()

  nouveauDeboucheForm: FormGroup = new FormGroup({
    deb_titre: new FormControl(null, [Validators.required]),
    deb_description: new FormControl(null, []),
    deb_isLink: new FormControl('0', [Validators.required]),
    deb_video: new FormControl(null, [])
  })

  constructor() { }

  ngOnInit(): void {
  }

  onFileChange(event: any) {
    if(this.nouveauDeboucheForm.get('deb_isLink')!.value == '0') {
      this.file = event.target.files[0]
    }
  }

  ajouterDebouches(): void {
    this.nouveauDeboucheForm.markAllAsTouched()

    if (this.nouveauDeboucheForm.valid) {
      let deboucheParcours: DeboucheParcoursType = {
        titre: this.nouveauDeboucheForm.get('deb_titre')!.value,
        description: this.nouveauDeboucheForm.get('deb_description')!.value,
        video: this.file ?? this.nouveauDeboucheForm.get('deb_video')!.value,
      }
      console.log(deboucheParcours)
      this.onAdd.emit(deboucheParcours)

      this.closeModal()
    }
  }

  closeModal(): void {
    this.file = undefined
    this.nouveauDeboucheForm.reset()
    this.nouveauDeboucheForm.get('deb_isLink')?.setValue('0')
    this.showDebouchesModal = false
    this.onClose.emit()
  }
}
