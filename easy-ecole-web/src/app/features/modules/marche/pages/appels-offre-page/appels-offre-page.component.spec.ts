import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppelsOffrePageComponent } from './appels-offre-page.component';

describe('AppelsOffrePageComponent', () => {
  let component: AppelsOffrePageComponent;
  let fixture: ComponentFixture<AppelsOffrePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppelsOffrePageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppelsOffrePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
