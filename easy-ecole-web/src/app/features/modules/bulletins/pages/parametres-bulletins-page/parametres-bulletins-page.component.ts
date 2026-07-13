import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-parametres-bulletins-page',
  templateUrl: './parametres-bulletins-page.component.html',
  styleUrls: ['./parametres-bulletins-page.component.scss']
})
export class ParametresBulletinsPageComponent extends BaseComponentClass implements OnInit {
  form: FormGroup;
  saved: boolean = false;

  constructor(private fb: FormBuilder) {
    super();
    this.form = this.fb.group({
      enteteEcole: ['Collège Moderne'],
      enteteAdresse: ['BP 1234, Abidjan, Côte d\'Ivoire'],
      enteteTelephone: ['+225 01 02 03 04 05'],
      enteteEmail: ['contact@college-moderne.ci'],
      piedPage: ['Bulletin officiel - Année scolaire 2025-2026'],
      afficherLogo: [true],
      afficherMoyenneClasse: [true],
      afficherRang: [true],
      afficherMention: [true],
      afficherAppreciation: [true],
      afficherSignature: [true],
      formatPapier: ['A4'],
      orientation: ['portrait'],
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }

  resetForm(): void {
    this.form.reset({
      enteteEcole: 'Collège Moderne',
      enteteAdresse: 'BP 1234, Abidjan, Côte d\'Ivoire',
      enteteTelephone: '+225 01 02 03 04 05',
      enteteEmail: 'contact@college-moderne.ci',
      piedPage: 'Bulletin officiel - Année scolaire 2025-2026',
      afficherLogo: true,
      afficherMoyenneClasse: true,
      afficherRang: true,
      afficherMention: true,
      afficherAppreciation: true,
      afficherSignature: true,
      formatPapier: 'A4',
      orientation: 'portrait',
    });
  }
}
