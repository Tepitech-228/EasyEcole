import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RattrapageService } from '../../services/rattrapage.service';
import { SessionExamenService } from '../../services/session-examen.service';

@Component({
  selector: 'app-rattrapage-form-page',
  templateUrl: './rattrapage-form-page.component.html',
  styleUrls: ['./rattrapage-form-page.component.scss']
})
export class RattrapageFormPageComponent extends BaseComponentClass implements OnInit {
  rattrapage: any = { coursParticipantId: null, coursId: null, sessionExamenId: null, statut: 'inscrit', salle: null, dateRattrapage: null, heureDebut: null, heureFin: null, enseignantId: null };
  sessions: any[] = [];
  isEdit = false;

  constructor(
    private service: RattrapageService,
    private sessionService: SessionExamenService,
    private router: Router,
    private route: ActivatedRoute
  ) { super(); }

  ngOnInit(): void {
    this.sessionService.getAll().subscribe({
      next: (res) => { this.sessions = res.filter((s: any) => s.type === 'rattrapage'); }
    });
  }

  save(): void {
    this.service.create(this.rattrapage).subscribe({
      next: () => { this.router.navigate(['/bulletins/rattrapages']); },
      error: (err) => { console.error(err); }
    });
  }
}
