import { TestBed } from '@angular/core/testing';

import { CommunitiesDataService } from './communities-data.service';

describe('CommunitiesDataService', () => {
    let service: CommunitiesDataService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CommunitiesDataService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
