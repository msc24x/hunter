import { TestBed } from '@angular/core/testing';

import { CompetitionsDataService } from './competitions-data.service';

describe('CompetitionsDataService', () => {
  let service: CompetitionsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompetitionsDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
