import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBarComponent } from './filter-bar';
import { LanguageService } from '@core';

describe('FilterBarComponent', () => {
  let fixture: ComponentFixture<FilterBarComponent>;
  let component: FilterBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
      providers: [LanguageService],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render search input and emit search changes', () => {
    let emitted = false;
    component.filterChange.subscribe(() => {
      emitted = true;
    });

    component.onSearchInput('math');
    expect(component.search()).toBe('math');
    expect(emitted).toBe(true);
  });

  it('should update selected grade and reset selected topic to all', () => {
    component.selectedTopic.set('fractions');
    let emitted = false;
    component.filterChange.subscribe(() => {
      emitted = true;
    });

    component.onSelectGrade('4ème Année');
    expect(component.selectedGrade()).toBe('4ème Année');
    expect(component.selectedTopic()).toBe('all');
    expect(emitted).toBe(true);
  });

  it('should update selected subject and reset selected topic to all', () => {
    component.selectedTopic.set('geometrie');
    let emitted = false;
    component.filterChange.subscribe(() => {
      emitted = true;
    });

    component.onSelectSubject('Mathématiques');
    expect(component.selectedSubject()).toBe('Mathématiques');
    expect(component.selectedTopic()).toBe('all');
    expect(emitted).toBe(true);
  });

  it('should update selected topic', () => {
    let emitted = false;
    component.filterChange.subscribe(() => {
      emitted = true;
    });

    component.onSelectTopic('Calcul');
    expect(component.selectedTopic()).toBe('Calcul');
    expect(emitted).toBe(true);
  });
});
