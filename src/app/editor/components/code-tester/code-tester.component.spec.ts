import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeTesterComponent } from './code-tester.component';

describe('CodeTesterComponent', () => {
  let component: CodeTesterComponent;
  let fixture: ComponentFixture<CodeTesterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CodeTesterComponent]
    });
    fixture = TestBed.createComponent(CodeTesterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
