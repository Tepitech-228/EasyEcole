import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CommunicationService } from 'src/app/data/modules/communication/services/communication.service';
import { Communication } from 'src/app/data/modules/communication/models/Communication.model';

@Component({
  selector: 'app-annonces-page',
  templateUrl: './annonces-page.component.html',
  styleUrls: ['./annonces-page.component.scss']
})
export class AnnoncesPageComponent extends BaseComponentClass implements OnInit {
  annonces: Communication[] = [];
  loading: boolean = true;

  constructor(private communicationService: CommunicationService) {
    super();
  }

  ngOnInit(): void {
    this.loading = true;
    this.communicationService.getAll().subscribe({
      next: (data) => { this.annonces = data; this.loading = false; },
      error: (err) => { console.log(err); this.loading = false; }
    });
  }

  cibleLabel(cible: string): string {
    const labels: any = { tous: 'Tout le monde', apprenants: 'Apprenants', enseignants: 'Enseignants', personnel: 'Personnel' };
    return labels[cible] || cible;
  }

  supprimerAnnonce(id: string): void {
    this.communicationService.delete(id).subscribe({
      next: () => {
        this.annonces = this.annonces.filter(a => a.id !== id);
      },
      error: (err) => console.log(err)
    });
  }
}
