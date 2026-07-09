import { describe, expect, it } from 'vitest';
import keyCode from './KeyCode';

const event = (code: string, modifiers: Partial<KeyboardEvent> = {}) => ({
  code,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...modifiers
}) as KeyboardEvent;

describe('keyCode', () => {
  it('normalizes supported keyboard codes', () => {
    expect(keyCode(event('KeyA'))).toBe('a');
    expect(keyCode(event('Digit7'))).toBe('7');
    expect(keyCode(event('Numpad7'))).toBe('7');
    expect(keyCode(event('Slash', { shiftKey: true }))).toBe('Shift+Slash');
    expect(keyCode(event('Backspace'))).toBe('');
  });
});