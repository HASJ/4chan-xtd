import { describe, expect, it } from 'vitest';
import SimpleDict from './SimpleDict';

describe('SimpleDict', () => {
  it('keeps insertion order and replaces an existing key', () => {
    const values = new SimpleDict<string>();

    values.push(2, 'second');
    values.push(1, 'first');
    values.push(2, 'updated');

    expect(values.keys).toEqual(['2', '1']);
    expect(values.get(2)).toBe('updated');
    expect(values.last()).toBe('first');
  });

  it('inserts numeric keys in sorted order and removes them cleanly', () => {
    const values = new SimpleDict<string>();

    values.insert(20, 'twenty');
    values.insert(10, 'ten');
    values.insert(15, 'fifteen');
    values.rm(15);

    expect(values.keys).toEqual(['10', '20']);
    expect(values.get(15)).toBeUndefined();
    expect(values.lastKey()).toBe('20');
  });
});
