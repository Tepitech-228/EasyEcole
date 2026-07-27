import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RelevesBancairesPageComponent } from './releves-bancaires-page.component';

describe('RelevesBancairesPageComponent', () => {
  let component: RelevesBancairesPageComponent;
  let fixture: ComponentFixture<RelevesBancairesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RelevesBancairesPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelevesBancairesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
