import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-nouveau-message-page',
  templateUrl: './nouveau-message-page.component.html',
  styleUrls: ['./nouveau-message-page.component.scss']
})
export class NouveauMessagePageComponent extends BaseComponentClass implements OnInit {
  destinataires = ['Admin', 'Service Scolarité', 'Bibliothèque', 'Service Financier', 'Direction'];
  nouveauMessage: any = { destinataire: '', sujet: '', contenu: '' };
  submitted = false;
  error = false;

  constructor(private router: Router) {
    super();
  }

  ngOnInit(): void {}

  envoyerMessage(): void {
    this.error = false;
    if (!this.nouveauMessage.destinataire || !this.nouveauMessage.sujet || !this.nouveauMessage.contenu) {
      this.error = true;
      return;
    }
    const stored = localStorage.getItem('communication_messages');
    const messages = stored ? JSON.parse(stored) : [];
    const maxId = messages.length > 0 ? Math.max(...messages.map((m: any) => m.id)) : 0;
    messages.push({
      id: maxId + 1,
      expediteur: 'Moi',
      destinataire: this.nouveauMessage.destinataire,
      sujet: this.nouveauMessage.sujet,
      contenu: this.nouveauMessage.contenu,
      date: new Date(),
      lu: false
    });
    localStorage.setItem('communication_messages', JSON.stringify(messages));
    this.submitted = true;
    setTimeout(() => this.router.navigate(['/communication/messagerie']), 1500);
  }
}
