import { TestBed } from '@angular/core/testing';

import { ImpersonationInterceptor } from './impersonation.interceptor';

describe('ImpersonationInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      ImpersonationInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: ImpersonationInterceptor = TestBed.inject(ImpersonationInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
