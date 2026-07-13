import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-messagerie-page',
  templateUrl: './messagerie-page.component.html',
  styleUrls: ['./messagerie-page.component.scss']
})
export class MessageriePageComponent extends BaseComponentClass implements OnInit {
  messages: any[] = [];
  private idCounter = 4;

  constructor(private router: Router) {
    super();
  }

  ngOnInit(): void {
    const stored = localStorage.getItem('communication_messages');
    if (stored) {
      this.messages = JSON.parse(stored);
    } else {
      this.messages = [
        { id: 1, expediteur: 'Admin', destinataire: 'Moi', sujet: 'Bienvenue sur la plateforme', contenu: 'Bonjour et bienvenue sur EasyEcole !', date: new Date(2026, 5, 20, 9, 0), lu: false },
        { id: 2, expediteur: 'Service Scolarité', destinataire: 'Moi', sujet: 'Réinscription 2026-2027', contenu: 'Les réinscriptions sont ouvertes du 1er juillet au 31 août.', date: new Date(2026, 5, 18, 14, 30), lu: true },
        { id: 3, expediteur: 'Bibliothèque', destinataire: 'Moi', sujet: 'Rappel de retour d\'ouvrage', contenu: 'Vous avez un ouvrage en retard. Merci de le retourner.', date: new Date(2026, 5, 15, 10, 15), lu: false }
      ];
      this.sauvegarder();
    }
  }

  get nonLus(): number {
    return this.messages.filter(m => !m.lu).length;
  }

  marquerCommeLu(id: number): void {
    const msg = this.messages.find(m => m.id === id);
    if (msg) {
      msg.lu = true;
      this.sauvegarder();
    }
  }

  supprimerMessage(id: number, event: Event): void {
    event.stopPropagation();
    this.messages = this.messages.filter(m => m.id !== id);
    this.sauvegarder();
  }

  private sauvegarder(): void {
    localStorage.setItem('communication_messages', JSON.stringify(this.messages));
  }
}
