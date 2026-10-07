import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { PointageService } from 'src/app/data/modules/inscription/services/pointage.service';
import { TerminalPointagePageComponent } from './terminal-pointage-page.component';

describe('TerminalPointagePageComponent', () => {
  let fixture: ComponentFixture<TerminalPointagePageComponent>;
  let pointageService: jasmine.SpyObj<PointageService>;

  beforeEach(async () => {
    pointageService = jasmine.createSpyObj<PointageService>('PointageService', ['getToday']);
    pointageService.getToday.and.returnValue(throwError(() => new Error('network unavailable')));

    await TestBed.configureTestingModule({
      declarations: [TerminalPointagePageComponent],
      providers: [{ provide: PointageService, useValue: pointageService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalPointagePageComponent);
  });

  it('shows an actionable error instead of claiming there was no pointage', () => {
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.componentInstance.loadError).toContain('Impossible de récupérer');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.pointage-self-empty')).toBeNull();
  });

  it('retries the failed request and clears the previous error', () => {
    pointageService.getToday.and.returnValues(
      throwError(() => new Error('network unavailable')),
      of(null)
    );
    fixture.detectChanges();
    fixture.componentInstance.retryLoadTodayPointage();

    expect(pointageService.getToday).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.loadError).toBe('');
    expect(fixture.componentInstance.loading).toBeFalse();
  });
});
