import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AuditNoteService } from '../../services/audit-note.service';

@Component({
  selector: 'app-audit-notes-page',
  templateUrl: './audit-notes-page.component.html',
  styleUrls: ['./audit-notes-page.component.scss']
})
export class AuditNotesPageComponent extends BaseComponentClass implements OnInit {
  items: any[] = [];
  loading = false;

  constructor(private service: AuditNoteService, private router: Router) { super(); }

  ngOnInit(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (res) => { this.items = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  trackByFn(index: number, item: any): number { return item.id; }
}
