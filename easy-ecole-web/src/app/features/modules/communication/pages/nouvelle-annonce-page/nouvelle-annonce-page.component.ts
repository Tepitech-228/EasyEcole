import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CommunicationService } from 'src/app/data/modules/communication/services/communication.service';

@Component({
  selector: 'app-nouvelle-annonce-page',
  templateUrl: './nouvelle-annonce-page.component.html',
  styleUrls: ['./nouvelle-annonce-page.component.scss']
})
export class NouvelleAnnoncePageComponent extends BaseComponentClass implements OnInit {
  nouvelleAnnonce: any = { titre: '', contenu: '', cible: 'tous' };
  submitted = false;
  error = false;
  cibles = [
    { value: 'tous', label: 'Tout le monde' },
    { value: 'apprenants', label: 'Apprenants' },
    { value: 'enseignants', label: 'Enseignants' },
    { value: 'personnel', label: 'Personnel' },
  ];

  constructor(private router: Router, private communicationService: CommunicationService) {
    super();
  }

  ngOnInit(): void {}

  creerAnnonce(): void {
    this.error = false;
    if (!this.nouvelleAnnonce.titre || !this.nouvelleAnnonce.contenu) {
      this.error = true;
      return;
    }

    this.communicationService.create({
      titre: this.nouvelleAnnonce.titre,
      contenu: this.nouvelleAnnonce.contenu,
      cible: this.nouvelleAnnonce.cible,
      statut: 'publiee'
    }).subscribe({
      next: () => {
        this.submitted = true;
        setTimeout(() => this.router.navigate(['/communication/annonces']), 1500);
      },
      error: () => {
        this.error = true;
      }
    });
  }
}
