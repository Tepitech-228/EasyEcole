import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DocGenWorkflowService } from 'src/app/data/modules/docgen/services/docgen-workflow.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { DocGenWorkflow } from 'src/app/data/modules/docgen/models/DocGenWorkflow.model';
import { DocGenType } from 'src/app/data/modules/docgen/models/DocGenType.model';

@Component({
  selector: 'app-workflows-page',
  templateUrl: './workflows-page.component.html',
  styleUrls: ['./workflows-page.component.scss']
})
export class WorkflowsPageComponent extends BaseComponentClass implements OnInit {
  types: DocGenType[] = [];
  steps: DocGenWorkflow[] = [];
  selectedTypeId: string = '';
  loading = false;
  editingStepIndex: number | null = null;
  stepForm: Partial<DocGenWorkflow> = {};
  roles = ['enseignant', 'directeur', 'comite_orientation', 'admin', 'institution'];

  constructor(
    private workflowService: DocGenWorkflowService,
    private typeService: DocGenTypeService,
    private route: ActivatedRoute,
  ) { super(); }

  ngOnInit(): void {
    this.typeService.getAll().subscribe(types => this.types = types);
    const typeId = this.route.snapshot.paramMap.get('typeId');
    if (typeId) { this.selectedTypeId = typeId; this.chargerSteps(); }
  }

  chargerSteps(): void {
    if (!this.selectedTypeId) { this.steps = []; return; }
    this.loading = true;
    this.workflowService.getByType(this.selectedTypeId).subscribe({
      next: (res) => { this.steps = res.sort((a, b) => (a.ordre || 0) - (b.ordre || 0)); this.loading = false; },
      error: () => this.loading = false
    });
  }

  ajouterEtape(): void {
    this.editingStepIndex = null;
    this.stepForm = { ordre: this.steps.length + 1, role: 'enseignant', libelle: '', delaiHeures: 48 };
  }

  editerEtape(step: DocGenWorkflow): void {
    this.editingStepIndex = this.steps.indexOf(step);
    this.stepForm = { ...step };
  }

  supprimerEtape(index: number): void {
    const step = this.steps[index];
    if (step.id) {
      this.workflowService.delete(step.id).subscribe({ next: () => this.chargerSteps() });
    } else {
      this.steps.splice(index, 1);
    }
  }

  sauvegarderEtape(): void {
    if (!this.stepForm.libelle || !this.stepForm.role) return;
    if (this.editingStepIndex !== null) {
      this.steps[this.editingStepIndex] = { ...this.steps[this.editingStepIndex], ...this.stepForm };
    } else {
      this.steps.push({ ...this.stepForm } as DocGenWorkflow);
    }
    this.editingStepIndex = null;
    this.stepForm = {};
  }

  sauvegarderWorkflow(): void {
    if (!this.selectedTypeId) return;
    this.workflowService.save({ typeId: this.selectedTypeId, steps: this.steps.map((s, i) => ({ ...s, ordre: i + 1 })) }).subscribe({
      next: () => alert('Workflow enregistré'),
      error: (err) => alert('Erreur: ' + err.message)
    });
  }
}
