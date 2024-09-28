import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GreenredComponent } from './greenred.component';

describe('GreenredComponent', () => {
  let component: GreenredComponent;
  let fixture: ComponentFixture<GreenredComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GreenredComponent]
    });
    fixture = TestBed.createComponent(GreenredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
