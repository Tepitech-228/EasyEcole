import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DocGenTemplateService } from 'src/app/data/modules/docgen/services/docgen-template.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { DocGenTemplate } from 'src/app/data/modules/docgen/models/DocGenTemplate.model';
import { DocGenType } from 'src/app/data/modules/docgen/models/DocGenType.model';

@Component({
  selector: 'app-templates-page',
  templateUrl: './templates-page.component.html',
  styleUrls: ['./templates-page.component.scss']
})
export class TemplatesPageComponent extends BaseComponentClass implements OnInit {
  templates: DocGenTemplate[] = [];
  types: DocGenType[] = [];
  loading = false;
  selectedTypeId: string = '';

  constructor(
    private templateService: DocGenTemplateService,
    private typeService: DocGenTypeService,
    private router: Router,
  ) { super(); }

  ngOnInit(): void {
    this.typeService.getAll().subscribe(types => this.types = types);
    this.getTemplates();
  }

  getTemplates(): void {
    this.loading = true;
    this.templateService.getAll(this.selectedTypeId || undefined).subscribe({
      next: (res) => { this.templates = res; this.loading = false; },
      error: () => this.loading = false
    });
  }

  editer(id?: string): void {
    this.router.navigate(['/docgen/templates', id]);
  }

  creer(typeId?: string): void {
    this.router.navigate(['/docgen/templates/new', typeId || '']);
  }

  supprimer(id?: string): void {
    if (!id || !confirm('Supprimer ce template ?')) return;
    this.templateService.delete(id).subscribe({ next: () => this.getTemplates() });
  }

  telecharger(tmpl: DocGenTemplate): void {
    if (!tmpl.id) return;
    this.templateService.getById(tmpl.id).subscribe(t => {
      const code = t.type?.code || 'template';
      const libelle = (t.libelle || 'template').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      const nom = `${code}-${libelle}-v${t.version || 1}.html`;
      const blob = new Blob([t.contenu || ''], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nom;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
