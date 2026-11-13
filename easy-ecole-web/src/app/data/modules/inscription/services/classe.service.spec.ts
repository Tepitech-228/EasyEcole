import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { Classe } from '../models/Classe.model';

import { ClasseService } from './classe.service';

describe('ClasseService', () => {
  let service: ClasseService;
  let httpMock: HttpTestingController;
  const classesUrl = `${environment.API_MODULES.INSCRIPTION}/classes`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ClasseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('reloads classes after creating one instead of replaying the cached list', () => {
    let classes: Classe[] = [];
    service.getAll().subscribe(result => classes = result);
    httpMock.expectOne(classesUrl).flush([]);

    service.create(new Classe()).subscribe();
    httpMock.expectOne({ method: 'POST', url: classesUrl }).flush(new Classe());

    service.getAll().subscribe(result => classes = result);
    httpMock.expectOne(classesUrl).flush([{ id: '1', libelle: 'Classe créée' }]);

    expect(classes.length).toBe(1);
    expect(classes[0].libelle).toBe('Classe créée');
  });
});
