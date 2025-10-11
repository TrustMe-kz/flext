import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'put';

export const DEFAULT_COLOR = 'text-blue-500';


// Tests

describe('"put" module', () => {
  it('renders value with the default color wrapper', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      expression: '{{ put data.city "Default City" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    expect(html).toBe(`<span class="${DEFAULT_COLOR}">Paris</span>`);
  });

  it('uses fallback value when input is missing', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      expression: '{{ put data.city "Default City" }}',
      data: { data: {} },
    }).trim();

    expect(html).toBe(`<span class="${DEFAULT_COLOR}">Default City</span>`);
  });

  it('respects the noColor helper variant', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      expression: '{{ put:noColor data.city "Default City" }}',
      data: { data: {} },
    }).trim();

    expect(html).toBe('Default City');
  });

  it('allows overriding the color via named argument', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      expression: '{{ put data.city "Default City" color="text-red-600" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    expect(html).toBe('<span class="text-red-600">Paris</span>');
  });

  it('treats zero as a valid value', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      expression: '{{ put data.count "Default" }}',
      data: { data: { count: 0 } },
    }).trim();

    expect(html).toBe(`<span class="${DEFAULT_COLOR}">0</span>`);
  });
});
