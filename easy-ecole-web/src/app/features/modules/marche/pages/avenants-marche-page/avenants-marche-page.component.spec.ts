import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AvenantsMarchePageComponent } from './avenants-marche-page.component';

describe('AvenantsMarchePageComponent', () => {
  let component: AvenantsMarchePageComponent;
  let fixture: ComponentFixture<AvenantsMarchePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AvenantsMarchePageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AvenantsMarchePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
