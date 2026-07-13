import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpLoaderService {

  private pendingRequests = 0
  private isLoading = new BehaviorSubject<boolean>(false)

  show(): void {
    this.pendingRequests++
    this.isLoading.next(true)
  }

  hide(): void {
    this.pendingRequests--
    if (this.pendingRequests <= 0) {
      this.pendingRequests = 0
      this.isLoading.next(false)
    }
  }

  get getValue(): Observable<boolean> {
    return this.isLoading
  }
}