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
  @Input() incompleteColor: string = 'bg-yellow-500'

  constructor() { }

  ngOnInit(): void {
  }

  /** L'étape courante est la première non complétée (ou la dernière si tout est fait). */
  estEtapeCourante(index: number): boolean {
    if (!this.items?.length) return false
    const premiereNonFaite = this.items.findIndex(item => !item.condition)
    if (premiereNonFaite === -1) return index === this.items.length - 1
    return index === premiereNonFaite
  }

  /** Cliquable si débloquée et que l'étape précédente est complétée. */
  peutCliquer(index: number): boolean {
    const item = this.items[index]
    if (!item || item.isBlocked) return false
    return index === 0 || !!this.items[index - 1].condition
  }

  cercleClasses(item: WizardItemType, index: number): string {
    const base: string[] = []

    if (item.condition && !item.incomplete) {
      // Étape terminée
      base.push(this.activeColor, 'border-transparent', 'text-white')
    }
    else if (item.incomplete) {
      // Terminée partiellement : à compléter
      base.push(this.incompleteColor, 'border-transparent', 'text-white')
    }
    else if (this.estEtapeCourante(index)) {
      // Étape en cours
      base.push('bg-white', 'border-primary-600', 'text-primary-600', 'ring-4', 'ring-green-100')
    }
    else {
      // En attente
      base.push('bg-white', 'border-gray-300', 'text-gray-400')
    }

    return base.join(' ')
  }

  numeroClasses(item: WizardItemType): string {
    if (item.condition && !item.incomplete) {
      return 'bg-green-600 border-green-600 text-white'
    }
    if (this.estEtapeCourante(this.items.indexOf(item))) {
      return 'bg-primary-600 border-primary-600 text-white'
    }
    return 'bg-white border-gray-300 text-gray-400'
  }

  labelClasses(item: WizardItemType, index?: number): string {
    if (item.condition && !item.incomplete) {
      return 'text-green-700'
    }
    if (item.incomplete) {
      return 'text-yellow-700'
    }
    const i = index ?? this.items.indexOf(item)
    if (this.estEtapeCourante(i)) {
      return 'text-gray-900 font-semibold'
    }
    return 'text-gray-400'
  }
}
