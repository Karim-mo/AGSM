import { TestBed } from '@angular/core/testing';

import { AgsmService } from './agsm.service';

describe('AgsmService', () => {
  let service: AgsmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgsmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
