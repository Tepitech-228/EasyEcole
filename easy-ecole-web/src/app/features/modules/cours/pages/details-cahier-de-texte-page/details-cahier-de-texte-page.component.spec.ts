import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { DetailsCahierDeTextePageComponent } from './details-cahier-de-texte-page.component';

describe('DetailsCahierDeTextePageComponent', () => {
  let component: DetailsCahierDeTextePageComponent;
  let fixture: ComponentFixture<DetailsCahierDeTextePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsCahierDeTextePageComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test' } } } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsCahierDeTextePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
