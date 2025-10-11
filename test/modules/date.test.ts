import { describe, it, expect } from 'vitest';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'date';


// Tests

describe('"date" module', () => {
  const data = {
    data: {
      createdAt: '2024-03-05T14:23:45Z',
    },
  };

  it('extracts padded day values via the base helper', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date data.createdAt "day" padding=2 timeZone="UTC" }}',
      data,
    }).trim();

    expect(html).toBe(mockPut('05'));
  });

  it('provides dedicated helpers for time units', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:minutes data.createdAt timeZone="UTC" }}',
      data,
    }).trim();

    expect(html).toBe(mockPut('23'));
  });

  it('supports locale-aware month names', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:monthText data.createdAt lang="fr-FR" nominative=true timeZone="UTC" }}',
      data,
    }).trim();

    expect(html).toBe(mockPut('mars'));
  });

  it('exposes helpers without color wrappers for numeric output', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:iso data.createdAt timeZone="UTC" }}',
      data,
    }).trim();

    expect(html).toBe('14:23:45.000Z');
  });

  it('respects the noColor variant for raw values', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:noColor data.createdAt "year" timeZone="UTC" }}',
      data,
    }).trim();

    expect(html).toBe('2024');
  });
});
