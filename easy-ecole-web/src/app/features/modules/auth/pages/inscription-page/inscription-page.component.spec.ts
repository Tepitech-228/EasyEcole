import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { InscriptionPageComponent } from './inscription-page.component';

describe('InscriptionPageComponent', () => {
  let component: InscriptionPageComponent;
  let fixture: ComponentFixture<InscriptionPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InscriptionPageComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ]
    })
    .compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InscriptionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debounces username suggestions while the student types', fakeAsync(() => {
    component.inscriptionForm.get('nom')?.setValue('Doe');
    component.inscriptionForm.get('prenoms')?.setValue('Jane');

    tick(699);
    httpMock.expectNone(request => request.url.includes('/register/identifiant-suggestions'));

    tick(1);
    const request = httpMock.expectOne(request => request.url.includes('/register/identifiant-suggestions'));
    expect(request.request.method).toBe('POST');
    request.flush({ suggestions: ['jane.doe'] });

    expect(component.identifiantSuggestions).toEqual(['jane.doe']);
  }));

  it('shows when username suggestions are temporarily rate-limited', fakeAsync(() => {
    component.inscriptionForm.get('nom')?.setValue('Doe');
    component.inscriptionForm.get('prenoms')?.setValue('Jane');
    tick(700);

    const request = httpMock.expectOne(request => request.url.includes('/register/identifiant-suggestions'));
    request.flush(
      { success: false, message: 'Trop de demandes' },
      { status: 429, statusText: 'Too Many Requests' }
    );

    expect(component.identifiantSuggestionsRateLimited).toBe(true);
    expect(component.identifiantSuggestionsError).toBe(true);
  }));
});
