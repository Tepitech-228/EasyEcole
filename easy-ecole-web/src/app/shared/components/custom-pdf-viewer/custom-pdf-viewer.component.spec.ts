import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPdfViewerComponent } from './custom-pdf-viewer.component';

describe('CustomPdfViewerComponent', () => {
  let component: CustomPdfViewerComponent;
  let fixture: ComponentFixture<CustomPdfViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomPdfViewerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomPdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
