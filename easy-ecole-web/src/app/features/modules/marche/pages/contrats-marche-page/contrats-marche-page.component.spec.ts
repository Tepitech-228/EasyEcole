import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContratsMarchePageComponent } from './contrats-marche-page.component';

describe('ContratsMarchePageComponent', () => {
  let component: ContratsMarchePageComponent;
  let fixture: ComponentFixture<ContratsMarchePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContratsMarchePageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContratsMarchePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
