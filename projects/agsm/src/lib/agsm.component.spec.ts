import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgsmComponent } from './agsm.component';

describe('AgsmComponent', () => {
  let component: AgsmComponent;
  let fixture: ComponentFixture<AgsmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgsmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgsmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
