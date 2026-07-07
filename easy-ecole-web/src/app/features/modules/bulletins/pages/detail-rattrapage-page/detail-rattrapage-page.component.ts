import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageService } from '../../services/rattrapage.service';

@Component({
  selector: 'app-detail-rattrapage-page',
  templateUrl: './detail-rattrapage-page.component.html',
  styleUrls: ['./detail-rattrapage-page.component.scss']
})
export class DetailRattrapagePageComponent extends BaseComponentClass implements OnInit {
  rattrapage: any = null;
  loading = false;

  constructor(
    private service: RattrapageService,
    private route: ActivatedRoute,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    this.loading = true;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getOne(id).subscribe({
      next: (res) => { this.rattrapage = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  update(): void {
    this.service.update(this.rattrapage.id, this.rattrapage).subscribe({
      next: () => { },
      error: (err) => { console.error(err); }
    });
  }

  notifier(): void {
    this.service.notifierEtudiants([this.rattrapage.id]).subscribe({
      next: () => { this.rattrapage.notificationEnvoyee = true; }
    });
  }

  supprimer(): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.service.delete(this.rattrapage.id).subscribe(() => {
      this.router.navigate(['/bulletins/rattrapages']);
    });
  }

  retour(): void {
    this.router.navigate(['/bulletins/rattrapages']);
  }
}
