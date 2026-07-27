import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TemplateEditPageComponent } from './template-edit-page.component';
import { DocGenTemplateService } from 'src/app/data/modules/docgen/services/docgen-template.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { of } from 'rxjs';

describe('TemplateEditPageComponent', () => {
  let component: TemplateEditPageComponent;
  let fixture: ComponentFixture<TemplateEditPageComponent>;

  beforeEach(async () => {
    const templateServiceSpy = jasmine.createSpyObj('DocGenTemplateService', ['getById', 'create', 'update', 'preview']);
    templateServiceSpy.preview.and.returnValue(of('<p>Aperçu</p>'));
    const typeServiceSpy = jasmine.createSpyObj('DocGenTypeService', ['getAll']);
    typeServiceSpy.getAll.and.returnValue(of([{ id: '1', code: 'BULLETIN', libelle: 'Bulletin' }]));

    await TestBed.configureTestingModule({
      declarations: [TemplateEditPageComponent],
      imports: [RouterTestingModule, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: DocGenTemplateService, useValue: templateServiceSpy },
        { provide: DocGenTypeService, useValue: typeServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateEditPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge les types au démarrage', () => {
    expect(component.types.length).toBe(1);
  });

  it('previewHtml mis à jour après preview', () => {
    component.template.contenu = 'Bonjour {{nom}}';
    component.preview();
    expect(component.previewHtml).toBe('Bonjour {{nom}}');
  });

  it('sauvegarder appel create pour nouveau template', () => {
    component.isNew = true;
    component.template.libelle = 'Test';
    component.template.contenu = 'Contenu';
    component.sauvegarder();
    const svc = TestBed.inject(DocGenTemplateService) as jasmine.SpyObj<DocGenTemplateService>;
    expect(svc.create).toHaveBeenCalled();
  });

  it('sauvegarder appel update pour template existant', () => {
    component.isNew = false;
    component.template.id = '2';
    component.template.libelle = 'Test';
    component.template.contenu = 'Contenu';
    component.sauvegarder();
    const svc = TestBed.inject(DocGenTemplateService) as jasmine.SpyObj<DocGenTemplateService>;
    expect(svc.update).toHaveBeenCalledWith('2', jasmine.any(Object));
  });
});
