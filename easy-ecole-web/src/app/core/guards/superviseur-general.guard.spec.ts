import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { LocalStorageService } from '../services/local-storage.service';
import { SuperviseurGeneralGuard } from './superviseur-general.guard';

describe('SuperviseurGeneralGuard', () => {
  let guard: SuperviseurGeneralGuard;
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
        SuperviseurGeneralGuard,
        { provide: LocalStorageService, useValue: localStorage }
      ]
    });
    guard = TestBed.inject(SuperviseurGeneralGuard);
    router = TestBed.inject(Router);
  });

  it('allows the supervisor general role', () => {
    localStorage.get.and.returnValue(tokenForRole(RolesUtilisateur.SUPERVISEUR_GENERAL));

    expect(guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toBeTrue();
  });

  it('redirects other roles to the home page', () => {
    localStorage.get.and.returnValue(tokenForRole(RolesUtilisateur.ADMIN));

    expect(guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toEqual(router.parseUrl('/'));
  });

  it('redirects to login when there is no token', () => {
    localStorage.get.and.returnValue(null);

    expect(guard.canActivate({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)).toEqual(router.parseUrl('/auth/connexion'));
  });
});
