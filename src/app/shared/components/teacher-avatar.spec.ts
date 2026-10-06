import { TestBed } from '@angular/core/testing';
import { TeacherAvatarComponent } from './teacher-avatar';

describe('TeacherAvatarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherAvatarComponent],
    }).compileComponents();
  });

  it('should generate initials for multi-word Latin names', () => {
    const fixture = TestBed.createComponent(TeacherAvatarComponent);
    fixture.componentRef.setInput('name', 'Mohamed Salah');
    fixture.detectChanges();

    expect(fixture.componentInstance.initials()).toBe('MS');
  });

  it('should generate initials for single word names', () => {
    const fixture = TestBed.createComponent(TeacherAvatarComponent);
    fixture.componentRef.setInput('name', 'Fatma');
    fixture.detectChanges();

    expect(fixture.componentInstance.initials()).toBe('FA');
  });

  it('should generate deterministic palette colors based on name hash', () => {
    const fixture1 = TestBed.createComponent(TeacherAvatarComponent);
    fixture1.componentRef.setInput('name', 'Habib Bourguiba');
    fixture1.detectChanges();

    const fixture2 = TestBed.createComponent(TeacherAvatarComponent);
    fixture2.componentRef.setInput('name', 'Habib Bourguiba');
    fixture2.detectChanges();

    expect(fixture1.componentInstance.bgColor()).toBe(fixture2.componentInstance.bgColor());
  });

  it('should compute correct pixel dimensions for different size inputs', () => {
    const fixture = TestBed.createComponent(TeacherAvatarComponent);
    fixture.componentRef.setInput('size', '2xl');
    fixture.detectChanges();

    expect(fixture.componentInstance.pixelDimension()).toBe(112);
  });
});
