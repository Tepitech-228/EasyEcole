import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Etablissement } from 'src/app/data/modules/etablissement/models/Etablissement.model';
import { EtablissementService } from 'src/app/data/modules/etablissement/services/etablissement.service';

@Component({
  selector: 'app-sites-page',
  templateUrl: './sites-page.component.html'
})
export class SitesPageComponent extends BaseComponentClass implements OnInit {
  sites: Etablissement[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  siteForm = new FormGroup({
    nom: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    site: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    code: new FormControl('', [Validators.maxLength(10)]),
    type: new FormControl(''),
    ville: new FormControl(''),
    pays: new FormControl(''),
    adresse: new FormControl('')
  });

  constructor(private etablissementService: EtablissementService) {
    super();
  }

  ngOnInit(): void {
    if (this.rolesValue.isAdmin) this.chargerSites();
  }

  chargerSites(): void {
    this.loading = true;
    this.errorMessage = '';
    this.etablissementService.getAll().subscribe({
      next: sites => {
        this.sites = Array.isArray(sites) ? sites : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Les sites ne peuvent pas être chargés. Vérifiez votre connexion et réessayez.';
      }
    });
  }

  creerSite(): void {
    if (!this.rolesValue.isAdmin || this.siteForm.invalid || this.saving) {
      this.siteForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const value = this.siteForm.getRawValue();
    const nouveauSite: Etablissement = {
      nom: String(value.nom || '').trim(),
      site: String(value.site || '').trim(),
      code: String(value.code || '').trim() || undefined,
      type: String(value.type || '').trim() || undefined,
      ville: String(value.ville || '').trim() || undefined,
      pays: String(value.pays || '').trim() || undefined,
      adresse: String(value.adresse || '').trim() || undefined,
      actif: true
    };

    this.etablissementService.create(nouveauSite).subscribe({
      next: site => {
        this.sites = [...this.sites, site].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        this.siteForm.reset({ nom: '', site: '', code: '', type: '', ville: '', pays: '', adresse: '' });
        this.successMessage = `Le site « ${site.nom} » a été créé.`;
        this.saving = false;
      },
      error: err => {
        this.errorMessage = err.error?.alreadyExists
          ? 'Un site avec ces informations existe déjà.'
          : err.error?.message || 'Le site n’a pas pu être créé. Vérifiez vos droits et les informations saisies.';
        this.saving = false;
      }
    });
  }

  localisation(site: Etablissement): string {
    return [site.ville, site.pays].filter(Boolean).join(', ') || '—';
  }
}
