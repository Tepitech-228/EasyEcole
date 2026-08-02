import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';

@Component({
  selector: 'app-infos-section',
  templateUrl: './infos-section.component.html',
  styleUrls: ['./infos-section.component.scss']
})
export class InfosSectionComponent implements OnInit {

  @Input() utilisateur!: Utilisateur
  @Output() nextStep: EventEmitter<void> = new EventEmitter()

  constructor() { }

  ngOnInit(): void {
    if (this.utilisateur?.apprenant != null) {
      this.nextStep.emit()
    }
  }

}
