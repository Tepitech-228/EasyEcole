import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { GedService, GedSession } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-sessions-page',
  templateUrl: './ged-sessions-page.component.html',
  styleUrls: ['./ged-sessions-page.component.scss'],
})
export class GedSessionsPageComponent implements OnInit {
  sessions: GedSession[] = [];
  loading = false;
  creating = false;
  sessionForm: FormGroup;
  search = '';

  constructor(
    private readonly gedService: GedService,
    private readonly fb: FormBuilder,
    private readonly router: Router
  ) {
    this.sessionForm = this.fb.group({
      title: [''],
      description: [''],
      fields: [''],
      participantIds: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    this.loading = true;
    try {
      const sessions = await this.gedService.getSessions().toPromise();
      this.sessions = sessions || [];
    } finally {
      this.loading = false;
    }
  }

  goToSession(sessionId: string): void {
    this.router.navigate(['/ged/sessions', sessionId]);
  }

  toggleCreate(): void {
    this.creating = !this.creating;
  }

  async createSession(): Promise<void> {
    if (this.sessionForm.invalid) {
      return;
    }

    const rawFields = this.sessionForm.value.fields || '';
    const participantIds = (this.sessionForm.value.participantIds || '')
      .split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);

    try {
      const payload = {
        nom: this.sessionForm.value.title,
        description: this.sessionForm.value.description,
        fields: rawFields
          .split(',')
          .map((field: string) => field.trim())
          .filter((field: string) => field.length > 0),
        participantIds,
      };

      const newSession = await this.gedService.createSession(payload).toPromise();
      if (!newSession) {
        return;
      }
      this.sessionForm.reset();
      this.creating = false;
      this.sessions.unshift(newSession);
      this.goToSession(newSession.id);
    } catch (error) {
      console.error(error);
    }
  }
}
