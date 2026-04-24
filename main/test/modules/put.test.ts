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

  it('noColor falls back for nullish values but not for false', () => {
    const nullHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.value "Fallback" }}',
      data: { data: { value: null } },
    }).trim();

    const undefinedHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.value "Fallback" }}',
      data: { data: {} },
    }).trim();

    const falseHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.value "Fallback" }}',
      data: { data: { value: false } },
    }).trim();

    expect(nullHtml).toBe('Fallback');
    expect(undefinedHtml).toBe('Fallback');
    expect(falseHtml).toBe('false');
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

  it('passes date formatting arguments through the put helper', () => {
    const html = getHtml({
      modules: [ MODULE_NAME, 'date' ],
      template: '{{ put:noColor data.createdAt lang="en-US" timeZone="UTC" }}',
      data: { data: { createdAt: '2024-03-05T14:23:45Z' } },
    }).trim();

    expect(html).toContain('3/5/2024');
  });

  it('keeps falsy but defined values without falling back', () => {
    const falseValue = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.flag "Fallback" }}',
      data: { data: { flag: false } },
    }).trim();

    const emptyValue = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.label "Fallback" }}',
      data: { data: { label: '' } },
    }).trim();

    expect(falseValue).toBe(mockPut('false'));
    expect(emptyValue).toBe(mockPut(''));
  });

  it('renders objects and arrays as formatted JSON', () => {
    const objectValue = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.user }}',
      data: { data: { user: { name: 'Anna', age: 30 } } },
    }).trim();

    const arrayValue = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.items }}',
      data: { data: { items: [ 'a', 'b' ] } },
    }).trim();

    expect(objectValue).toBe('{\n  &quot;name&quot;: &quot;Anna&quot;,\n  &quot;age&quot;: 30\n}');
    expect(arrayValue).toBe('[\n  &quot;a&quot;,\n  &quot;b&quot;\n]');
  });

  it('wraps formatted object JSON with the default color helper', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.user }}',
      data: { data: { user: { name: 'Anna' } } },
    }).trim();

    expect(html).toBe('<span class="text-blue-500">{\n  "name": "Anna"\n}</span>');
  });

  it('falls back to the unwrapped SafeString branch when color is explicitly empty', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put data.city "Default City" color="" }}',
      data: { data: { city: 'Paris' } },
    }).trim();

    expect(html).not.toContain('<span class=');
    expect(html).toBe('[object Object]');
  });

  it('formats valid date values through the date formatter path', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ put:noColor data.createdAt }}',
      data: { data: { createdAt: '2024-03-05T14:23:45Z' } },
    }).trim();

    expect(html).toContain('3/5/2024');
  });
});
