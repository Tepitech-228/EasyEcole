import { Component, Input, OnInit } from '@angular/core';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';

@Component({
  selector: 'app-infos-section',
  templateUrl: './infos-section.component.html',
  styleUrls: ['./infos-section.component.scss']
})
export class InfosSectionComponent implements OnInit {

  @Input() utilisateur!: Utilisateur

  constructor() { }

  ngOnInit(): void {
  }

}
