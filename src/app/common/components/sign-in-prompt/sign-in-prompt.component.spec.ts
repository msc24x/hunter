import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignInPromptComponent } from './sign-in-prompt.component';

describe('SignInPromptComponent', () => {
  let component: SignInPromptComponent;
  let fixture: ComponentFixture<SignInPromptComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SignInPromptComponent]
    });
    fixture = TestBed.createComponent(SignInPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
