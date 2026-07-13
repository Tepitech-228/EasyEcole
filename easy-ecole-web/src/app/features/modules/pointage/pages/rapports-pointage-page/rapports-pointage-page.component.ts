import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface RapportEntry {
  employe: string
  totalHeures: number
  totalPresences: number
  totalAbsences: number
  totalRetards: number
}

@Component({
  selector: 'app-rapports-pointage-page',
  templateUrl: './rapports-pointage-page.component.html',
  styleUrls: ['./rapports-pointage-page.component.scss']
})
export class RapportsPointagePageComponent extends BaseComponentClass {
  summary = {
    employesActifs: 24,
    presentsAujourdhui: 18,
    absentsAujourdhui: 4,
    enRetardAujourdhui: 2,
    tauxPresence: 75,
  }

  entries: RapportEntry[] = [
    { employe: 'Jean Dupont', totalHeures: 160, totalPresences: 20, totalAbsences: 1, totalRetards: 2 },
    { employe: 'Marie Claire', totalHeures: 152, totalPresences: 19, totalAbsences: 2, totalRetards: 0 },
    { employe: 'Paul Martin', totalHeures: 168, totalPresences: 21, totalAbsences: 0, totalRetards: 1 },
    { employe: 'Sophie Bernard', totalHeures: 144, totalPresences: 18, totalAbsences: 3, totalRetards: 3 },
    { employe: 'Luc Koffi', totalHeures: 160, totalPresences: 20, totalAbsences: 1, totalRetards: 0 },
  ]
}
