import { describe, it, expect, beforeEach } from 'vitest';
import $$ from './$$';

describe('$$', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="test">Item 1</div>
      <div class="test">Item 2</div>
      <div id="root">
        <span class="inner">Inner 1</span>
        <span class="inner">Inner 2</span>
      </div>
    `;
  });

  it('should find all elements matching a selector in document.body by default', () => {
    const elements = $$('.test');
    expect(elements).toHaveLength(2);
    expect(elements[0].textContent).toBe('Item 1');
    expect(elements[1].textContent).toBe('Item 2');
    expect(Array.isArray(elements)).toBe(true);
  });

  it('should find elements within a specified root', () => {
    const root = document.getElementById('root')!;
    const elements = $$('.inner', root);
    expect(elements).toHaveLength(2);
    expect(elements[0].textContent).toBe('Inner 1');
    expect(elements[1].textContent).toBe('Inner 2');
  });

  it('should return an empty array if no elements match', () => {
    const elements = $$('.non-existent');
    expect(elements).toHaveLength(0);
    expect(Array.isArray(elements)).toBe(true);
  });
});
