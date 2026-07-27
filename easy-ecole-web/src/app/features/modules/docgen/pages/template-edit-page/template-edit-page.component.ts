import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DocGenTemplateService } from 'src/app/data/modules/docgen/services/docgen-template.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { DocGenTemplate } from 'src/app/data/modules/docgen/models/DocGenTemplate.model';
import { DocGenType } from 'src/app/data/modules/docgen/models/DocGenType.model';

@Component({
  selector: 'app-template-edit-page',
  templateUrl: './template-edit-page.component.html',
  styleUrls: ['./template-edit-page.component.scss']
})
export class TemplateEditPageComponent extends BaseComponentClass implements OnInit {
  template: Partial<DocGenTemplate> = { contenu: '', libelle: '', variables: '' };
  types: DocGenType[] = [];
  isNew = true;
  previewHtml = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private templateService: DocGenTemplateService,
    private typeService: DocGenTypeService,
  ) { super(); }

  ngOnInit(): void {
    this.typeService.getAll().subscribe(types => this.types = types);
    const id = this.route.snapshot.paramMap.get('id');
    const typeId = this.route.snapshot.paramMap.get('typeId');
    if (id && id !== 'new') {
      this.isNew = false;
      this.templateService.getById(id).subscribe(t => {
        this.template = t;
      });
    } else if (typeId) {
      this.template.typeId = typeId;
    }
  }

  preview(): void {
    this.previewHtml = this.template.contenu || '';
  }

  sauvegarder(): void {
    if (!this.template.libelle || !this.template.contenu) return;
    const data = { ...this.template, variables: this.template.variables || '' };
    if (this.isNew) {
      this.templateService.create(data).subscribe({
        next: () => this.router.navigate(['/docgen/templates']),
        error: (err) => alert('Erreur: ' + err.message)
      });
    } else {
      this.templateService.update(this.template.id!, data).subscribe({
        next: () => this.router.navigate(['/docgen/templates']),
        error: (err) => alert('Erreur: ' + err.message)
      });
    }
  }

  annuler(): void {
    this.router.navigate(['/docgen/templates']);
  }
}
