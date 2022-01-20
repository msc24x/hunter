import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SigninDialogComponent } from './signin-dialog.component';

describe('SigninDialogComponent', () => {
  let component: SigninDialogComponent;
  let fixture: ComponentFixture<SigninDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SigninDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SigninDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
