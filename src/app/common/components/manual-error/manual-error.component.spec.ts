import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualErrorComponent } from './manual-error.component';

describe('ManualErrorComponent', () => {
  let component: ManualErrorComponent;
  let fixture: ComponentFixture<ManualErrorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManualErrorComponent]
    });
    fixture = TestBed.createComponent(ManualErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
