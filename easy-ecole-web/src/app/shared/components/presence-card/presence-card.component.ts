import { Component, Input, OnInit } from '@angular/core';
import { ListePresence } from 'src/app/data/modules/inscription/models/ListePresence.model';

@Component({
  selector: 'app-presence-card',
  templateUrl: './presence-card.component.html',
  styleUrls: ['./presence-card.component.scss']
})
export class PresenceCardComponent implements OnInit {

  @Input() listePresence?: ListePresence

  constructor() { }

  ngOnInit(): void {
  }

}
