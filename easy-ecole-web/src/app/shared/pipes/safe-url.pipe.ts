import { HttpClient } from '@angular/common/http';
import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'safeUrl'
})
export class SafeUrlPipe implements PipeTransform {

  constructor(private readonly http: HttpClient, private readonly sanitizer: DomSanitizer) { }

  transform(url: string): Observable<SafeResourceUrl> {
    return this.http
      .get(this.sanitizer.sanitize(SecurityContext.URL, url)!, { responseType: 'blob' })
      .pipe(map((val) => this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(val))));
  }

}
