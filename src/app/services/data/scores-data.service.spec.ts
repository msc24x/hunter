import { TestBed } from '@angular/core/testing';

import { ScoresDataService } from './scores-data.service';

describe('ScoresDataService', () => {
  let service: ScoresDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoresDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
