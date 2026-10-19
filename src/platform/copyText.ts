import { d } from '../globals/globals';
import $ from './$';

export default function copyText(text: string): boolean {
  const el = $.el('textarea', {
    className: 'copy-text-element',
    value: text,
  });
  $.add(d.body, el);
  el.select();
  try {
    return (d as any).execCommand('copy');
  } catch (error) {
    console.warn('Copy failed', error);
    return false;
  } finally {
    $.rm(el);
  }
}
