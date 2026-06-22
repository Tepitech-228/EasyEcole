import { Component, OnInit } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-mon-releve-page',
  templateUrl: './mon-releve-page.component.html',
  styleUrls: ['./mon-releve-page.component.scss']
})
export class MonRelevePageComponent extends BaseComponentClass implements OnInit {
  bulletins: any[] = [];
  loading: boolean = false;

  constructor(private bulletinService: BulletinService) { super(); }

  ngOnInit() {
    this.loading = true;
    this.bulletinService.monReleve().subscribe({
      next: (data) => this.bulletins = Array.isArray(data) ? data : [data],
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  getSemestre(s: string): string {
    return s === 'semestre1' ? 'Semestre 1' : 'Semestre 2';
  }

  getNoteClass(v: number | null): string {
    if (v == null) return '';
    return v >= 10 ? 'text-emerald-700' : 'text-red-700';
  }

  getMentionLabel(m: string): { class: string; label: string } {
    const map: Record<string, { class: string; label: string }> = {
      'Très Bien': { class: 'from-green-400 to-green-600', label: 'Très Bien' },
      'Bien': { class: 'from-blue-400 to-blue-600', label: 'Bien' },
      'Assez Bien': { class: 'from-indigo-400 to-indigo-600', label: 'Assez Bien' },
      'Passable': { class: 'from-amber-400 to-amber-600', label: 'Passable' },
      'Insuffisant': { class: 'from-red-400 to-red-600', label: 'Insuffisant' },
    };
    return map[m] || { class: 'from-gray-400 to-gray-600', label: m };
  }
}
