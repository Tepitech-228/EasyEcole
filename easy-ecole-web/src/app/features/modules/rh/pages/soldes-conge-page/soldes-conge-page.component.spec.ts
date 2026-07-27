import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SoldesCongePageComponent } from './soldes-conge-page.component';

describe('SoldesCongePageComponent', () => {
  let component: SoldesCongePageComponent;
  let fixture: ComponentFixture<SoldesCongePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SoldesCongePageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoldesCongePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
