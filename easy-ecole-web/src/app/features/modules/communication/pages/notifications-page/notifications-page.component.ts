import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent extends BaseComponentClass implements OnInit {
  notifications: any[] = [];

  constructor() {
    super();
  }

  ngOnInit(): void {
    const stored = localStorage.getItem('communication_notifications');
    if (stored) {
      this.notifications = JSON.parse(stored);
    } else {
      this.notifications = [
        { id: 1, titre: 'Nouveau message', message: 'Vous avez reçu un message de l\'administration.', date: new Date(2026, 5, 22, 10, 30), lue: false },
        { id: 2, titre: 'Annonce publiée', message: 'Une nouvelle annonce a été publiée dans la rubrique Actualités.', date: new Date(2026, 5, 21, 15, 0), lue: false },
        { id: 3, titre: 'Rappel', message: 'Votre inscription sera cloturée dans 7 jours.', date: new Date(2026, 5, 20, 8, 0), lue: true },
        { id: 4, titre: 'Mise à jour', message: 'Votre profil a été mis à jour avec succès.', date: new Date(2026, 5, 18, 12, 45), lue: true },
        { id: 5, titre: 'Nouveau document', message: 'Un nouveau document pédagogique est disponible.', date: new Date(2026, 5, 16, 9, 15), lue: false }
      ];
      localStorage.setItem('communication_notifications', JSON.stringify(this.notifications));
    }
  }

  get nonLues(): number {
    return this.notifications.filter(n => !n.lue).length;
  }

  marquerToutCommeLu(): void {
    this.notifications.forEach(n => n.lue = true);
    localStorage.setItem('communication_notifications', JSON.stringify(this.notifications));
  }

  marquerCommeLue(id: number): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.lue = true;
      localStorage.setItem('communication_notifications', JSON.stringify(this.notifications));
    }
  }

  supprimerNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    localStorage.setItem('communication_notifications', JSON.stringify(this.notifications));
  }
}
