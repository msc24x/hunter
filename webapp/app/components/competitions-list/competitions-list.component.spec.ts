import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionsListComponent } from './competitions-list.component';

describe('CompetitionsListComponent', () => {
  let component: CompetitionsListComponent;
  let fixture: ComponentFixture<CompetitionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompetitionsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompetitionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
