import { SafeUrlPipe } from './safe-url.pipe';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SafeUrlPipe', () => {
  it('create an instance', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const http = TestBed.inject(HttpClient);
    const sanitizer = TestBed.inject(DomSanitizer);
    const pipe = new SafeUrlPipe(http, sanitizer);
    expect(pipe).toBeTruthy();
  });
});
