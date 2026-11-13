import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { LocalStorageService } from '../services/local-storage.service';
import { SuiviRecouvrementGuard } from './suivi-recouvrement.guard';

describe('SuiviRecouvrementGuard', () => {
  let guard: SuiviRecouvrementGuard;
  let localStorage: jasmine.SpyObj<LocalStorageService>;
  let router: Router;

  const tokenForRole = (role: string): string => {
    const payload = btoa(JSON.stringify({ role }));
    return `header.${payload}.signature`;
  };

  beforeEach(() => {
    localStorage = jasmine.createSpyObj('LocalStorageService', ['get']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        SuiviRecouvrementGuard,
        { provide: LocalStorageService, useValue: localStorage }
      ]
    });
    guard = TestBed.inject(SuiviRecouvrementGuard);
    router = TestBed.inject(Router);
  });

  it('allows the supervisor general role', () => {
    localStorage.get.and.returnValue(tokenForRole(RolesUtilisateur.SUPERVISEUR_GENERAL));

    expect(guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toBeTrue();
  });

  it('allows the admin role', () => {
    localStorage.get.and.returnValue(tokenForRole(RolesUtilisateur.ADMIN));

    expect(guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toBeTrue();
  });

  it('redirects other roles to the home page', () => {
    localStorage.get.and.returnValue(tokenForRole(RolesUtilisateur.ESA_COMPTA));

    expect(guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toEqual(router.parseUrl('/'));
  });

  it('redirects to login when there is no token', () => {
    localStorage.get.and.returnValue(null);

    expect(guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toEqual(router.parseUrl('/auth/connexion'));
  });
});
