import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private collapsedSource = new BehaviorSubject<boolean>(false)
  collapsed$ = this.collapsedSource.asObservable()

  constructor() {
    const saved = localStorage.getItem('sidebarCollapsed') === 'true'
    this.collapsedSource.next(saved)
  }

  setCollapsed(value: boolean): void {
    this.collapsedSource.next(value)
  }
}
