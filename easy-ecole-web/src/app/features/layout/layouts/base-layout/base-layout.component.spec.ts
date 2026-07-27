import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { SidebarStateService } from 'src/app/features/layout/services/sidebar-state.service';
import { PermissionStateService } from 'src/app/core/services/permission-state.service';
import { NotificationService } from 'src/app/data/modules/elearning/services/notification.service';
import { SseService } from 'src/app/data/services/sse.service';
import { NotificationSoundService } from 'src/app/data/services/notification-sound.service';

import { BaseLayoutComponent } from './base-layout.component';

describe('BaseLayoutComponent', () => {
  let component: BaseLayoutComponent;
  let fixture: ComponentFixture<BaseLayoutComponent>;

  beforeEach(async () => {
    const notifSubject = new Subject<any>();
    await TestBed.configureTestingModule({
      declarations: [ BaseLayoutComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test' } } } },
        { provide: SidebarStateService, useValue: jasmine.createSpyObj('SidebarStateService', ['setCollapsed', 'getCollapsed']) },
        { provide: PermissionStateService, useValue: jasmine.createSpyObj('PermissionStateService', ['loadPermissions', 'hasPermission']) },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['getAll', 'marquerLu']) },
        { provide: SseService, useValue: { notifications$: notifSubject.asObservable() } },
        { provide: NotificationSoundService, useValue: { play: jasmine.createSpy(), toggle: jasmine.createSpy().and.returnValue(true), isEnabled: true } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
