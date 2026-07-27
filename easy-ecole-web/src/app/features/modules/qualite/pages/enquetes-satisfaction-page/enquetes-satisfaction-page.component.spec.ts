import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EnquetesSatisfactionPageComponent } from './enquetes-satisfaction-page.component';
import { QualiteEnqueteSatisfactionService } from 'src/app/data/modules/qualite/services/qualite-non-conformite.service';
import { of } from 'rxjs';

describe('EnquetesSatisfactionPageComponent', () => {
  let component: EnquetesSatisfactionPageComponent;
  let fixture: ComponentFixture<EnquetesSatisfactionPageComponent>;

  beforeEach(async () => {
    const svcSpy = jasmine.createSpyObj('QualiteEnqueteSatisfactionService', ['getAll', 'create', 'update', 'delete', 'getStatistiques']);
    svcSpy.getAll.and.returnValue(of([{ id: '1', titre: 'Satisfaction parents', cible: 'parents', statut: 'active' }]));

    await TestBed.configureTestingModule({
      declarations: [EnquetesSatisfactionPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [{ provide: QualiteEnqueteSatisfactionService, useValue: svcSpy }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnquetesSatisfactionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('charge les enquêtes', () => {
    expect(component.items.length).toBe(1);
    expect(component.items[0].titre).toBe('Satisfaction parents');
  });
  it('voirStats récupère les stats', () => {
    const svc = TestBed.inject(QualiteEnqueteSatisfactionService) as jasmine.SpyObj<QualiteEnqueteSatisfactionService>;
    svc.getStatistiques.and.returnValue(of({ total: 5 }));
    component.voirStats('1');
    expect(svc.getStatistiques).toHaveBeenCalledWith('1');
  });
});
