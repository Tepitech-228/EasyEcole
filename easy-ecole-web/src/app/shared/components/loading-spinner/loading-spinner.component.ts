import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpLoaderService } from 'src/app/core/services/http-loader.service';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent implements OnInit, OnDestroy {

  isLoading: boolean = false
  private subscription!: Subscription

  constructor(private httpLoaderService: HttpLoaderService) { }

  ngOnInit(): void {
    this.subscription = this.httpLoaderService.getValue.subscribe({
      next: (loading) => {
        this.isLoading = loading
      }
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

}
