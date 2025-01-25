import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuesTypeLabelComponent } from './ques-type-label.component';

describe('QuesTypeLabelComponent', () => {
  let component: QuesTypeLabelComponent;
  let fixture: ComponentFixture<QuesTypeLabelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuesTypeLabelComponent]
    });
    fixture = TestBed.createComponent(QuesTypeLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
