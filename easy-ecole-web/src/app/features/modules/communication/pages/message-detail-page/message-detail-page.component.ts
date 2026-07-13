import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-message-detail-page',
  templateUrl: './message-detail-page.component.html',
  styleUrls: ['./message-detail-page.component.scss']
})
export class MessageDetailPageComponent extends BaseComponentClass implements OnInit {
  message: any = null;

  constructor(private route: ActivatedRoute) {
    super();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const stored = localStorage.getItem('communication_messages');
    if (stored) {
      const messages = JSON.parse(stored);
      this.message = messages.find((m: any) => m.id === id) || null;
      if (this.message && !this.message.lu) {
        this.message.lu = true;
        localStorage.setItem('communication_messages', JSON.stringify(messages));
      }
    }
  }
}
