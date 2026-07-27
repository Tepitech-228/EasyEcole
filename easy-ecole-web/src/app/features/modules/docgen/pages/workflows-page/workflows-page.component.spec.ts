import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WorkflowsPageComponent } from './workflows-page.component';
import { DocGenWorkflowService } from 'src/app/data/modules/docgen/services/docgen-workflow.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { of } from 'rxjs';

describe('WorkflowsPageComponent', () => {
  let component: WorkflowsPageComponent;
  let fixture: ComponentFixture<WorkflowsPageComponent>;

  beforeEach(async () => {
    const workflowServiceSpy = jasmine.createSpyObj('DocGenWorkflowService', ['getByType', 'save', 'delete']);
    workflowServiceSpy.getByType.and.returnValue(of([{ id: '1', ordre: 1, role: 'enseignant' }]));
    const typeServiceSpy = jasmine.createSpyObj('DocGenTypeService', ['getAll']);
    typeServiceSpy.getAll.and.returnValue(of([{ id: '1', code: 'BULLETIN', libelle: 'Bulletin' }]));

    await TestBed.configureTestingModule({
      declarations: [WorkflowsPageComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: DocGenWorkflowService, useValue: workflowServiceSpy },
        { provide: DocGenTypeService, useValue: typeServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge les types au démarrage', () => {
    expect(component.types.length).toBe(1);
  });

  it('chargerSteps charge les étapes du workflow', () => {
    component.selectedTypeId = '1';
    component.chargerSteps();
    const svc = TestBed.inject(DocGenWorkflowService) as jasmine.SpyObj<DocGenWorkflowService>;
    expect(svc.getByType).toHaveBeenCalledWith('1');
  });

  it('ajouterEtape initialise stepForm', () => {
    component.ajouterEtape();
    expect(component.stepForm.role).toBe('enseignant');
    expect(component.stepForm.ordre).toBe(1);
  });

  it('editerEtape préremplit le formulaire', () => {
    const step = { id: '1', ordre: 1, role: 'enseignant', libelle: 'Signature', delaiHeures: 48 };
    component.steps = [step as any];
    component.editerEtape(step as any);
    expect(component.editingStepIndex).toBe(0);
    expect(component.stepForm.role).toBe('enseignant');
  });

  it('sauvegarderEtape met à jour une étape existante', () => {
    const step = { ordre: 1, role: '', libelle: 'Test' };
    component.steps = [step as any];
    component.editingStepIndex = 0;
    component.stepForm = { ordre: 1, role: 'directeur', libelle: 'Signature direction', delaiHeures: 24 };
    component.sauvegarderEtape();
    expect(component.steps[0].role).toBe('directeur');
    expect(component.editingStepIndex).toBeNull();
  });

  it('supprimerEtape enlève l étape locale', () => {
    component.steps = [{ id: undefined, ordre: 1, role: 'admin' }, { ordre: 2, role: 'enseignant' }] as any;
    component.supprimerEtape(0);
    expect(component.steps.length).toBe(1);
  });
});
