import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  static readonly AUTH_TOKEN: string = '_token'

  constructor() { }

  get(key: string): string | null {
    return localStorage.getItem(key)
  }

  remove(key: string): void {
    localStorage.removeItem(key)
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value)
  }
}
