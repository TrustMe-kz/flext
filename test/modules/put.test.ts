import { describe, it, expect } from 'vitest';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'put';


// Tests

describe('"put" module', () => {
  it('renders value with the default color wrapper', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.city "Default City" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    expect(html).toBe(mockPut('Paris'));
  });

  it('uses fallback value when input is missing', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.city "Default City" }}',
      data: { data: {} },
    }).trim();

    expect(html).toBe(mockPut('Default City'));
  });

  it('respects the noColor helper variant', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.city "Default City" }}',
      data: { data: {} },
    }).trim();

    expect(html).toBe('Default City');
  });

  it('allows overriding the color via named argument', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.city "Default City" color="text-red-600" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    expect(html).toBe(mockPut('Paris', 'text-red-600'));
  });

  it('treats zero as a valid value', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.count "Default" }}',
      data: { data: { count: 0 } },
    }).trim();

    expect(html).toBe(mockPut('0'));
  });
});
