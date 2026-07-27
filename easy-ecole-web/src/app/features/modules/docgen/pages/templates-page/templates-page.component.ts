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
}
