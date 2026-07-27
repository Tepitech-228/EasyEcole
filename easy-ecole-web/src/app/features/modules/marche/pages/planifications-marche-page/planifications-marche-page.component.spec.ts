import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlanificationsMarchePageComponent } from './planifications-marche-page.component';

describe('PlanificationsMarchePageComponent', () => {
  let component: PlanificationsMarchePageComponent;
  let fixture: ComponentFixture<PlanificationsMarchePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlanificationsMarchePageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanificationsMarchePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
