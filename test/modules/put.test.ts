import { describe, it, expect } from 'vitest';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'put';


// Tests

describe('"put" module', () => {
  it('noColor returns raw values without decoration', () => {
    const rawValue = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.city "Default City" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    const fallbackValue = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.city "Default City" }}',
      data: { data: {} },
    }).trim();

    expect(rawValue).toBe('Paris');
    expect(fallbackValue).toBe('Default City');
  });

  it('default helper wraps the value with color and respects overrides', () => {
    const colored = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.city "Default City" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    const fallback = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.city "Default City" }}',
      data: { data: {} },
    }).trim();

    const overriddenColor = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.city "Default City" color="text-red-600" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    const zeroValue = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.count "Default" }}',
      data: { data: { count: 0 } },
    }).trim();

    expect(colored).toBe(mockPut('Paris'));
    expect(fallback).toBe(mockPut('Default City'));
    expect(overriddenColor).toBe(mockPut('Paris', 'text-red-600'));
    expect(zeroValue).toBe(mockPut('0'));
  });
});
