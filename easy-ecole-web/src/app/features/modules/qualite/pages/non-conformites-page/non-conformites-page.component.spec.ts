import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NonConformitesPageComponent } from './non-conformites-page.component';
import { QualiteNonConformiteService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';
import { of } from 'rxjs';

describe('NonConformitesPageComponent', () => {
  let component: NonConformitesPageComponent;
  let fixture: ComponentFixture<NonConformitesPageComponent>;

  beforeEach(async () => {
    const svcSpy = jasmine.createSpyObj('QualiteNonConformiteService', ['getAll', 'create', 'update', 'delete']);
    svcSpy.getAll.and.returnValue(of([{ id: '1', type: 'majeure', source: 'Audit', description: 'Test', statut: 'ouverte', priorite: 'haute' }]));

    await TestBed.configureTestingModule({
      declarations: [NonConformitesPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [{ provide: QualiteNonConformiteService, useValue: svcSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NonConformitesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('charge les NC au démarrage', () => {
    expect(component.items.length).toBe(1);
    expect(component.items[0].type).toBe('majeure');
  });
  it('ouvrirFormulaire initialise pour nouveau', () => {
    component.ouvrirFormulaire();
    expect(component.showForm).toBeTrue();
    expect(component.formData.type).toBe('mineure');
  });
  it('ouvrirFormulaire préremplit pour édition', () => {
    component.ouvrirFormulaire({ id: '2', type: 'critique', source: 'Test', description: 'Desc', priorite: 'haute', processus: 'Pédagogie' } as any);
    expect(component.editingId).toBe('2');
    expect(component.formData.type).toBe('critique');
  });
  it('getBadgeColor retourne une couleur', () => {
    expect(component.getBadgeColor('critique')).toBe('red');
    expect(component.getBadgeColor('mineure')).toBe('yellow');
  });
});
