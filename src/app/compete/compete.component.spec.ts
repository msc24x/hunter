import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompeteComponent } from './compete.component';

describe('CompeteComponent', () => {
  let component: CompeteComponent;
  let fixture: ComponentFixture<CompeteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompeteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompeteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
