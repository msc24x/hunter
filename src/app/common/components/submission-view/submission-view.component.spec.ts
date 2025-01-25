import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionViewComponent } from './submission-view.component';

describe('SubmissionViewComponent', () => {
  let component: SubmissionViewComponent;
  let fixture: ComponentFixture<SubmissionViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubmissionViewComponent]
    });
    fixture = TestBed.createComponent(SubmissionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
