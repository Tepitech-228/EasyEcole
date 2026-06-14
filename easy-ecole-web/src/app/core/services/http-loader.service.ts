import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpLoaderService {

  private isLoading = new BehaviorSubject<boolean>(false)

  constructor() { }

  show(): void {
    this.isLoading.next(true)
  }

  hide(): void {
    this.isLoading.next(false)
  }

  get getValue(): Observable<boolean> {
    return this.isLoading
  }
}