import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  private cookieStore: Record<string, string> = {}

  constructor() {
    this.parseCookies(document.cookie);
  }

  public parseCookies(cookies = document.cookie) {
    this.cookieStore = {};

    if (!!cookies === false) { return; }

    const cookiesArray = cookies.split(';');
    for (const cookie of cookiesArray) {
      const cookieMap = cookie.split('=');
      this.cookieStore[cookieMap[0].trim()] = cookieMap[1];
    }
  }

  get(key: string): string | null {
    this.parseCookies();
    return !!this.cookieStore[key] ? this.cookieStore[key] : null;
  }

  remove(key: string): void {
    document.cookie = `${key} = ; expires=Thu, 1 jan 1990 12:00:00 UTC; path=/`;
  }

  set(key: string, value: string): void {
    document.cookie = key + '=' + (value || '');
  }
}
