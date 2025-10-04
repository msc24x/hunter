import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunitiesComponent } from './communities.component';

describe('CommunitiesComponent', () => {
  let component: CommunitiesComponent;
  let fixture: ComponentFixture<CommunitiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CommunitiesComponent]
    });
    fixture = TestBed.createComponent(CommunitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
