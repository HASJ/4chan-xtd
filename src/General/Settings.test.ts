import { beforeEach, describe, expect, it } from 'vitest';
import Settings from './Settings';
import Config from '../config/Config';
import { Conf } from '../globals/globals';

describe('Settings.main subtabs', () => {
  beforeEach(() => {
    for (const key in Conf) delete Conf[key];
    Settings.selectedMainSubtab = undefined;
  });

  it('renders subtabs for each main settings category and selects the first by default', () => {
    const section = document.createElement('section');
    Settings.main(section);

    const subnav = section.querySelector('.subsections-list');
    expect(subnav).not.toBeNull();

    const categories = Object.keys(Config.main);
    const subtabs = subnav!.querySelectorAll('a');
    expect(subtabs.length).toBe(categories.length);

    // First subtab is selected by default
    expect(subtabs[0].classList.contains('tab-selected')).toBe(true);
    expect(subtabs[0].textContent).toBe(categories[0]);

    // Only the first category fieldset is visible, all others are hidden
    const fieldsets = section.querySelectorAll<HTMLFieldSetElement>('fieldset.main-category-fieldset');
    expect(fieldsets.length).toBe(categories.length);
    expect(fieldsets[0].hidden).toBe(false);
    for (let i = 1; i < fieldsets.length; i++) {
      expect(fieldsets[i].hidden).toBe(true);
    }
  });

  it('switches visible category fieldset when a subtab is clicked', () => {
    const section = document.createElement('section');
    Settings.main(section);

    const subnav = section.querySelector('.subsections-list')!;
    const subtabs = subnav.querySelectorAll<HTMLAnchorElement>('a');
    const fieldsets = section.querySelectorAll<HTMLFieldSetElement>('fieldset.main-category-fieldset');

    // Click on the second subtab ("Linkification")
    subtabs[1].click();

    expect(subtabs[0].classList.contains('tab-selected')).toBe(false);
    expect(subtabs[1].classList.contains('tab-selected')).toBe(true);
    expect(fieldsets[0].hidden).toBe(true);
    expect(fieldsets[1].hidden).toBe(false);
    expect(Settings.selectedMainSubtab).toBe(Object.keys(Config.main)[1]);
  });
});
