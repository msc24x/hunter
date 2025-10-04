import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCommunityComponent } from './create-community.component';

describe('CreateCommunityComponent', () => {
  let component: CreateCommunityComponent;
  let fixture: ComponentFixture<CreateCommunityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateCommunityComponent]
    });
    fixture = TestBed.createComponent(CreateCommunityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
