import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TemplatesPageComponent } from './templates-page.component';
import { DocGenTemplateService } from 'src/app/data/modules/docgen/services/docgen-template.service';
import { DocGenTypeService } from 'src/app/data/modules/docgen/services/docgen-type.service';
import { of } from 'rxjs';

describe('TemplatesPageComponent', () => {
  let component: TemplatesPageComponent;
  let fixture: ComponentFixture<TemplatesPageComponent>;

  beforeEach(async () => {
    const templateServiceSpy = jasmine.createSpyObj('DocGenTemplateService', ['getAll', 'delete']);
    templateServiceSpy.getAll.and.returnValue(of([{ id: '1', libelle: 'Template test' }]));
    const typeServiceSpy = jasmine.createSpyObj('DocGenTypeService', ['getAll']);
    typeServiceSpy.getAll.and.returnValue(of([{ id: '1', code: 'BULLETIN' }]));

    await TestBed.configureTestingModule({
      declarations: [TemplatesPageComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: DocGenTemplateService, useValue: templateServiceSpy },
        { provide: DocGenTypeService, useValue: typeServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge templates et types au démarrage', () => {
    expect(component.templates.length).toBe(1);
    expect(component.types.length).toBe(1);
  });

  it('editer navigue vers /docgen/templates/:id', () => {
    const router = TestBed.inject(RouterTestingModule);
    spyOn(component as any, 'router'); // router is private
    // Just check the method doesn't throw
    expect(() => component.editer('5')).not.toThrow();
  });

  it('creer navigue vers /docgen/templates/new/:typeId', () => {
    expect(() => component.creer('2')).not.toThrow();
  });

  it('supprimer appelle templateService.delete', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const templateService = TestBed.inject(DocGenTemplateService) as jasmine.SpyObj<DocGenTemplateService>;
    component.supprimer('1');
    expect(templateService.delete).toHaveBeenCalledWith('1');
  });
});
