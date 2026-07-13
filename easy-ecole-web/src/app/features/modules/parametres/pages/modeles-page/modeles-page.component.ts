import { Component } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

interface Modele {
  id: string
  nom: string
  type: string
  sujet: string
  modifieLe: string
}

@Component({
  selector: 'app-modeles-page',
  templateUrl: './modeles-page.component.html',
  styleUrls: ['./modeles-page.component.scss']
})
export class ModelesPageComponent extends BaseComponentClass {
  modeles: Modele[] = [
    { id: '1', nom: 'Confirmation d\'inscription', type: 'Email', sujet: 'Confirmation de votre inscription', modifieLe: '2026-06-20' },
    { id: '2', nom: 'Relance de paiement', type: 'Email', sujet: 'Rappel de paiement des frais', modifieLe: '2026-06-19' },
    { id: '3', nom: 'Notification absence', type: 'Email', sujet: 'Signalement d\'absence', modifieLe: '2026-06-18' },
    { id: '4', nom: 'Bulletin disponible', type: 'Email', sujet: 'Votre bulletin est disponible', modifieLe: '2026-06-15' },
    { id: '5', nom: 'Confirmation inscription SMS', type: 'SMS', sujet: 'Inscription confirmée', modifieLe: '2026-06-10' },
  ]
  loading: boolean = false

  constructor() { super() }
}
