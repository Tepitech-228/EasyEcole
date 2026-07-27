import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RapprochementPageComponent } from './rapprochement-page.component';

describe('RapprochementPageComponent', () => {
  let component: RapprochementPageComponent;
  let fixture: ComponentFixture<RapprochementPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RapprochementPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RapprochementPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
