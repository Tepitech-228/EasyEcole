import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BulletinService } from '../../services/bulletin.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-detail-bulletin-page',
  templateUrl: './detail-bulletin-page.component.html',
  styleUrls: ['./detail-bulletin-page.component.scss']
})
export class DetailBulletinPageComponent extends BaseComponentClass implements OnInit {
  bulletin: any | null = null;
  loading: boolean = false;
  appreciation: string = '';
  sauvegardeSuccess: boolean = false;
  publicationSuccess: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private bulletinService: BulletinService,
    private router: Router
  ) {
    super();
  }

  ngOnInit() {
    if (!this.rolesValue.isInstitution && !this.rolesValue.isEnseignant) {
      this.router.navigate(['/bulletins']);
      return;
    }
    const id = this.route.snapshot.params['id'];
    if (id) this.charger(id);
  }

  charger(id: number) {
    this.loading = true;
    this.bulletinService.getOne(id).subscribe({
      next: (data) => {
        this.bulletin = data;
        this.appreciation = data.appreciation || '';
      },
      complete: () => this.loading = false
    });
  }

  sauvegarderAppreciation() {
    const id = this.bulletin?.id;
    if (!id) return;
    this.bulletinService.update(id, { appreciation: this.appreciation }).subscribe({
      next: (data) => {
        this.bulletin = data;
        this.sauvegardeSuccess = true;
        setTimeout(() => this.sauvegardeSuccess = false, 3000);
      }
    });
  }

  publier() {
    const id = this.bulletin?.id;
    if (!id) return;
    this.bulletinService.publier(id).subscribe({
      next: (data) => {
        this.bulletin = data;
        this.publicationSuccess = true;
        setTimeout(() => this.publicationSuccess = false, 3000);
      }
    });
  }

  imprimer() {
    window.print();
  }

  getSemestre(s: string): string {
    return s === 'semestre1' ? 'Semestre 1' : 'Semestre 2';
  }

  getNoteClass(v: number | null): string {
    if (v == null) return '';
    return v >= 10 ? 'text-green-700' : 'text-red-700';
  }
}
