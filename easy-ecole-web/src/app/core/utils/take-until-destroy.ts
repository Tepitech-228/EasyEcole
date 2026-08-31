import { MonoTypeOperatorFunction, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const destroySubjects = new WeakMap<object, Subject<void>>();

export function untilDestroyed<T>(componentInstance: any): MonoTypeOperatorFunction<T> {
  let destroy$ = destroySubjects.get(componentInstance);

  if (!destroy$) {
    const subject = new Subject<void>();
    destroySubjects.set(componentInstance, subject);
    destroy$ = subject;

    const originalDestroy = componentInstance.ngOnDestroy;
    componentInstance.ngOnDestroy = function (this: any, ...args: any[]): void {
      subject.next();
      subject.complete();
      destroySubjects.delete(componentInstance);
      if (originalDestroy) originalDestroy.apply(this, args);
    };
  }

  return (source: Observable<T>) => source.pipe(takeUntil(destroy$ as any));
}