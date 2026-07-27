import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DemandesCongePageComponent } from './demandes-conge-page.component';
import { of } from 'rxjs';

describe('DemandesCongePageComponent', () => {
  let component: DemandesCongePageComponent;
  let fixture: ComponentFixture<DemandesCongePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DemandesCongePageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DemandesCongePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
  it('getTypeConge retourne libellé', () => {
    expect(component.getTypeConge('annuel')).toBe('Annuel');
    expect(component.getTypeConge('sans_solde')).toBe('Sans solde');
  });
});
