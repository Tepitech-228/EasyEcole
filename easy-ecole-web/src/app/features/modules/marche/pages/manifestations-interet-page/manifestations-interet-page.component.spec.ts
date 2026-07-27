import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ManifestationsInteretPageComponent } from './manifestations-interet-page.component';

describe('ManifestationsInteretPageComponent', () => {
  let component: ManifestationsInteretPageComponent;
  let fixture: ComponentFixture<ManifestationsInteretPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManifestationsInteretPageComponent],
      imports: [HttpClientTestingModule, FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManifestationsInteretPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());
});
