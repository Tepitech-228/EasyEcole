import { Component, Input, OnInit } from '@angular/core';
import { WizardItemType } from 'src/app/data/types/WizardItemType';

@Component({
  selector: 'app-custom-wizard',
  templateUrl: './custom-wizard.component.html',
  styleUrls: ['./custom-wizard.component.scss']
})
export class CustomWizardComponent implements OnInit {

  @Input() items!: WizardItemType[]
  @Input() activeColor: string = 'bg-primary-600'
  @Input() inactiveColor: string = 'bg-gray-300'
  @Input() incompleteColor: string = 'bg-yellow-600'

  constructor() { }

  ngOnInit(): void {
  }

}
