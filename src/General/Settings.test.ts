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

  it('keeps subtabs stationary above section-container in dialog and manages visibility', () => {
    // Set up Settings.dialog structure matching SettingsHtml.tsx
    const dialog = document.createElement('div');
    dialog.id = 'fourchanx-settings';
    dialog.innerHTML = `
      <nav>
        <div class="sections-list">
          <a class="tab-main">Main</a>
          <a class="tab-filter">Filter</a>
        </div>
        <div class="credits"></div>
      </nav>
      <div class="subsections-list" hidden></div>
      <div class="section-container"><section></section></div>
    `;
    Settings.dialog = dialog;

    const section = dialog.querySelector('section')!;
    const subnav = dialog.querySelector<HTMLDivElement>('.subsections-list')!;
    const container = dialog.querySelector<HTMLDivElement>('.section-container')!;

    // Call openSection for Main
    Settings.openSection.call({ title: 'Main', hyphenatedTitle: 'main', open: Settings.main });

    expect(subnav.hidden).toBe(false);
    expect(subnav.parentElement).toBe(dialog);
    // Ensure subnav is a sibling of section-container, not inside it
    expect(container.contains(subnav)).toBe(false);

    const subtabs = subnav.querySelectorAll<HTMLAnchorElement>('a');
    expect(subtabs.length).toBe(Object.keys(Config.main).length);

    // Simulate scrolled container and switch subtab
    container.scrollTop = 150;
    subtabs[2].click();
    expect(container.scrollTop).toBe(0);

    // Navigate to another section (e.g. Filter)
    Settings.openSection.call({ title: 'Filter', hyphenatedTitle: 'filter', open: () => {} });
    expect(subnav.hidden).toBe(true);

    // Clean up
    delete Settings.dialog;
  });
});
