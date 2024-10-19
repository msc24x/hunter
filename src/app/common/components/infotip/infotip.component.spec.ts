import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfotipComponent } from './infotip.component';

describe('InfotipComponent', () => {
  let component: InfotipComponent;
  let fixture: ComponentFixture<InfotipComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InfotipComponent]
    });
    fixture = TestBed.createComponent(InfotipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
