import { describe, it, expect } from 'vitest';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'math';


// Tests

describe('"math" module', () => {
  it('performs arithmetic via the base helper', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math 3 "plus" 5 }}',
    }).trim();

    expect(html).toBe(mockPut('8'));
  });

  it('exposes dedicated helpers for common operations', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:divide 10 2 }}',
    }).trim();

    expect(html).toBe(mockPut('5'));
  });

  it('supports Math API operations such as sqrt', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math "sqrt" 9 }}',
    }).trim();

    expect(html).toBe(mockPut('3'));
  });

  it('respects the noColor variant for raw output', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:noColor 7 "minus" 2 }}',
    }).trim();

    expect(html).toBe('5');
  });

  it('provides rounding helpers with mode overrides', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:round 2.9 "floor" }}',
    }).trim();

    expect(html).toBe(mockPut('2'));
  });
});
