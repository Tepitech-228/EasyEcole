import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { FournisseurService } from 'src/app/data/modules/stocks/services/fournisseur.service';
import { Fournisseur } from 'src/app/data/modules/stocks/models/Fournisseur.model';

@Component({
  selector: 'app-liste-fournisseurs-page',
  templateUrl: './liste-fournisseurs-page.component.html',
  styleUrls: ['./liste-fournisseurs-page.component.scss']
})
export class ListeFournisseursPageComponent extends BaseComponentClass implements OnInit {
  fournisseurs: Fournisseur[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  formData: any = { nom: '', contact: '', email: '', telephone: '', adresse: '' };

  constructor(private fournisseurService: FournisseurService) { super(); }

  ngOnInit(): void {
    this.getFournisseurs();
  }

  getFournisseurs(): void {
    this.loading = true;
    this.fournisseurService.getAll().subscribe({
      next: (res) => { this.fournisseurs = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  ouvrirFormulaire() {
    this.formData = { nom: '', contact: '', email: '', telephone: '', adresse: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerFournisseur() {
    if (!this.formData.nom) return;
    const f = new Fournisseur();
    f.nom = this.formData.nom;
    f.contact = this.formData.contact || undefined;
    f.email = this.formData.email || undefined;
    f.telephone = this.formData.telephone || undefined;
    f.adresse = this.formData.adresse || undefined;
    this.fournisseurService.create(f).subscribe({
      next: () => { this.fermerFormulaire(); this.getFournisseurs(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer ce fournisseur ?')) return;
    this.fournisseurService.delete(id).subscribe({ next: () => this.getFournisseurs() });
  }

  trackByFn(index: number, item: Fournisseur): any { return item.id; }
}
