import { Component, Input, OnInit } from '@angular/core';
import { ListePresence } from 'src/app/data/modules/inscription/models/ListePresence.model';

@Component({
  selector: 'app-liste-presence-card',
  templateUrl: './liste-presence-card.component.html',
  styleUrls: ['./liste-presence-card.component.scss']
})
export class ListePresenceCardComponent implements OnInit {

  @Input() listePresence?: ListePresence

  constructor() { }

  ngOnInit(): void {
  }

}
