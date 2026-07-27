import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComptesBancairesPageComponent } from './comptes-bancaires-page.component';

describe('ComptesBancairesPageComponent', () => {
  let component: ComptesBancairesPageComponent;
  let fixture: ComponentFixture<ComptesBancairesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComptesBancairesPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComptesBancairesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
