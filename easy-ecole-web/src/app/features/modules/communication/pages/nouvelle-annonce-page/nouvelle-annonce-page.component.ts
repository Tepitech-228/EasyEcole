import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-nouvelle-annonce-page',
  templateUrl: './nouvelle-annonce-page.component.html',
  styleUrls: ['./nouvelle-annonce-page.component.scss']
})
export class NouvelleAnnoncePageComponent extends BaseComponentClass implements OnInit {
  nouvelleAnnonce: any = { titre: '', contenu: '' };
  submitted = false;
  error = false;

  constructor(private router: Router) {
    super();
  }

  ngOnInit(): void {}

  creerAnnonce(): void {
    this.error = false;
    if (!this.nouvelleAnnonce.titre || !this.nouvelleAnnonce.contenu) {
      this.error = true;
      return;
    }
    const stored = localStorage.getItem('communication_annonces');
    const annonces = stored ? JSON.parse(stored) : [];
    const maxId = annonces.length > 0 ? Math.max(...annonces.map((a: any) => a.id)) : 0;
    annonces.unshift({
      id: maxId + 1,
      titre: this.nouvelleAnnonce.titre,
      contenu: this.nouvelleAnnonce.contenu,
      auteur: 'Moi',
      date: new Date()
    });
    localStorage.setItem('communication_annonces', JSON.stringify(annonces));
    this.submitted = true;
    setTimeout(() => this.router.navigate(['/communication/annonces']), 1500);
  }
}
