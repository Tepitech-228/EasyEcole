import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, timer } from 'rxjs';
import { switchMap, catchError, retry, map, tap, share } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface SseNotification {
  id: number;
  type: string;
  message: string;
  date: string;
  lu: boolean;
}

export interface SseEvent {
  type: 'notification' | 'edt_publie' | 'rappel_salle' | 'connected' | 'keepalive';
  data: any;
}

@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private eventSource: EventSource | null = null;
  private notificationSubject = new Subject<SseNotification>();
  private fallbackActive = false;
  private fallbackSub: any = null;

  readonly notifications$ = this.notificationSubject.asObservable();

  constructor(private http: HttpClient, private zone: NgZone) {
    this.connect();
  }

  private connect(): void {
    try {
      const token = localStorage.getItem('_token');
      const url = `${environment.API_URL}/events?token=${token}`;
      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('connected', (() => {
        this.fallbackActive = false;
        this.stopFallback();
      }) as EventListener);

      this.eventSource.addEventListener('notification', ((event: MessageEvent) => {
        const data: SseNotification = JSON.parse(event.data);
        this.zone.run(() => this.notificationSubject.next(data));
      }) as EventListener);

      this.eventSource.addEventListener('error', (() => {
        this.eventSource?.close();
        this.eventSource = null;
        if (!this.fallbackActive) {
          this.fallbackActive = true;
          this.startFallback();
        }
      }) as EventListener);
    } catch {
      this.fallbackActive = true;
      this.startFallback();
    }
  }

  private startFallback(): void {
    this.fallbackSub = interval(30000).pipe(
      switchMap(() => this.http.get<any[]>(`${environment.API_MODULES.ELEARNING}/notifications`)),
      catchError(() => []),
      map(notifs => (notifs || []).filter((n: any) => !n.lu)),
    ).subscribe(notifs => {
      for (const n of notifs) {
        this.zone.run(() => this.notificationSubject.next(n));
      }
    });
  }

  private stopFallback(): void {
    if (this.fallbackSub) {
      this.fallbackSub.unsubscribe();
      this.fallbackSub = null;
    }
  }

  reconnect(): void {
    this.disconnect();
    this.fallbackActive = false;
    this.connect();
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.stopFallback();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
