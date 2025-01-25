import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgKatexComponent } from './ng-katex.component';

describe('NgKatexComponent', () => {
  let component: NgKatexComponent;
  let fixture: ComponentFixture<NgKatexComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NgKatexComponent]
    });
    fixture = TestBed.createComponent(NgKatexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
