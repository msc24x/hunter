import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomAppBarComponent } from './bottom-app-bar.component';

describe('BottomAppBarComponent', () => {
  let component: BottomAppBarComponent;
  let fixture: ComponentFixture<BottomAppBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BottomAppBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomAppBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
