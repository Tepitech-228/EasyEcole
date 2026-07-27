import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CachetPageComponent } from './cachet-page.component';
import { DocGenCachetService } from 'src/app/data/modules/docgen/services/docgen-cachet.service';
import { of } from 'rxjs';

describe('CachetPageComponent', () => {
  let component: CachetPageComponent;
  let fixture: ComponentFixture<CachetPageComponent>;

  beforeEach(async () => {
    const cachetServiceSpy = jasmine.createSpyObj('DocGenCachetService', ['getAll', 'upload', 'update', 'setActive', 'delete']);
    cachetServiceSpy.getAll.and.returnValue(of([{ id: '1', libelle: 'Cachet officiel', isActive: true }]));

    await TestBed.configureTestingModule({
      declarations: [CachetPageComponent],
      imports: [HttpClientTestingModule],
      providers: [{ provide: DocGenCachetService, useValue: cachetServiceSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CachetPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('charge les cachets au démarrage', () => {
    expect(component.cachets.length).toBe(1);
    expect(component.cachets[0].libelle).toBe('Cachet officiel');
  });

  it('ouvrirFormulaire initialise pour nouveau cachet', () => {
    component.ouvrirFormulaire();
    expect(component.showForm).toBeTrue();
    expect(component.editingId).toBeNull();
    expect(component.formData.libelle).toBe('');
  });

  it('ouvrirFormulaire préremplit pour édition', () => {
    const cachet = { id: '2', libelle: 'Cachet test', positionX: 100, positionY: 200, width: 80, height: 80, isActive: false };
    component.ouvrirFormulaire(cachet as any);
    expect(component.editingId).toBe('2');
    expect(component.formData.libelle).toBe('Cachet test');
  });

  it('setActive appelle le service', () => {
    component.setActive('1');
    const svc = TestBed.inject(DocGenCachetService) as jasmine.SpyObj<DocGenCachetService>;
    expect(svc.setActive).toHaveBeenCalledWith('1');
  });

  it('getImageUrl retourne l URL complète', () => {
    const url = component.getImageUrl({ imagePath: 'uploads/cachets/test.png' } as any);
    expect(url).toContain('http://localhost:3000/');
    expect(url).toContain('test.png');
  });
});
