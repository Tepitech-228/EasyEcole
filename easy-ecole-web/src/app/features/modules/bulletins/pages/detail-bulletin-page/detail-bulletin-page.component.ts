import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BulletinService } from '../../services/bulletin.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Etablissement } from 'src/app/data/modules/etablissement/models/Etablissement.model';
import { EtablissementService } from 'src/app/data/modules/etablissement/services/etablissement.service';
import { environment } from 'src/environments/environment';

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
  signingEnseignant: boolean = false;
  signingChef: boolean = false;

  etablissement: Etablissement | null = null;
  /** Fallback silencieux si aucun établissement n'est configuré. */
  readonly DEFAULT_LOGO = 'assets/images/logo-esa.png';

  constructor(
    private route: ActivatedRoute,
    private bulletinService: BulletinService,
    private etablissementService: EtablissementService,
    private router: Router
  ) {
    super();
    this.etablissementService.getEtablissement().subscribe(etablissement => {
      this.etablissement = etablissement;
    });
  }

  ngOnInit() {
    if (!this.rolesValue.isInstitution && !this.rolesValue.isEnseignant) {
      this.router.navigate(['/bulletins']);
      return;
    }
    const id = this.route.snapshot.params['id'];
    if (id) this.charger(id);
  }

  get etablissementNom(): string {
    return this.etablissement?.nom || '';
  }

  get etablissementNomMajuscules(): string {
    return this.etablissementNom.toUpperCase();
  }

  get etablissementCode(): string {
    return this.etablissement?.code || '';
  }

  get etablissementVille(): string {
    return this.etablissement?.ville || '';
  }

  get etablissementPays(): string {
    return this.etablissement?.pays || '';
  }

  get etablissementTelephone(): string {
    return this.etablissement?.telephone || '';
  }

  get etablissementEmail(): string {
    return this.etablissement?.email || '';
  }

  get logoUrl(): string {
    const logo = this.etablissement?.logo;
    return logo ? `${environment.API_BASE_URL}${logo.replace(/^\/+/, '')}` : this.DEFAULT_LOGO;
  }

  get etablissementLocalisation(): string {
    return [this.etablissementVille, this.etablissementPays].filter(Boolean).join(', ');
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

  saveSignatureEnseignant(signature: string) {
    if (!this.bulletin?.id) return;
    this.bulletinService.signerEnseignant(this.bulletin.id, signature).subscribe({
      next: (data) => {
        this.bulletin = data;
        this.signingEnseignant = false;
      }
    });
  }

  saveSignatureChef(signature: string) {
    if (!this.bulletin?.id) return;
    this.bulletinService.signerChef(this.bulletin.id, signature).subscribe({
      next: (data) => {
        this.bulletin = data;
        this.signingChef = false;
      }
    });
  }

  getSemestre(s: string): string {
    const map: Record<string, string> = {
      'semestre1': 'Semestre 1',
      'semestre2': 'Semestre 2',
      'semestre3': 'Semestre 3',
      'semestre4': 'Semestre 4',
      'semestre5': 'Semestre 5',
      'semestre6': 'Semestre 6'
    };
    return map[s] || s;
  }

  getNoteClass(v: number | null): string {
    if (v == null) return '';
    return v >= 10 ? 'text-green-700' : 'text-blue-700';
  }

  getDecision(b: any): string {
    if (b.moyenneGenerale == null) return '-';
    if (b.moyenneGenerale >= 10) return 'ADMIS(E) (Semestre validé)';
    if (b.moyenneGenerale >= 7) return 'RATTRAPAGE';
    return 'AJOURNÉ(E)';
  }

  getDateFait(b: any): string {
    const d = b.datePublication ? new Date(b.datePublication) : new Date();
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getTeacherName(cours: any): string {
    if (!cours) return '-';
    if (cours.enseignantNom) return cours.enseignantNom;
    if (cours.utilisateur?.nom) return `${cours.utilisateur.nom} ${cours.utilisateur.prenoms || ''}`.trim();
    return '-';
  }
}
