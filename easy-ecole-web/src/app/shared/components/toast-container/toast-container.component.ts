import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss']
})
export class ToastContainerComponent implements OnInit, OnDestroy {

  toasts: Toast[] = []
  private subscription!: Subscription

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe({
      next: (toast) => {
        this.toasts.push(toast)
        setTimeout(() => this.remove(toast.id), 4000)
      }
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id)
  }

}
