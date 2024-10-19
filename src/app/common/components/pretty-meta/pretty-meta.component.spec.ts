import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrettyMetaComponent } from './pretty-meta.component';

describe('PrettyMetaComponent', () => {
  let component: PrettyMetaComponent;
  let fixture: ComponentFixture<PrettyMetaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrettyMetaComponent]
    });
    fixture = TestBed.createComponent(PrettyMetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
