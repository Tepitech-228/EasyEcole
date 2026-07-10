import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { NotificationService, Notification } from 'src/app/data/modules/elearning/services/notification.service';

@Component({
  selector: 'app-notifications-page',
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.scss']
})
export class NotificationsPageComponent extends BaseComponentClass implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {
    super();
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getAll().subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: () => {
        this.notifications = [];
      }
    });
  }

  get nonLues(): number {
    return this.notifications.filter(n => !n.lu).length;
  }

  marquerToutCommeLu(): void {
    const promises = this.notifications
      .filter(n => !n.lu)
      .map(n => this.notificationService.marquerLu(n.id).toPromise());
    Promise.all(promises).then(() => {
      this.loadNotifications();
    });
  }

  marquerCommeLue(id: number): void {
    this.notificationService.marquerLu(id).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.lu = true;
      }
    });
  }

  supprimerNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}
