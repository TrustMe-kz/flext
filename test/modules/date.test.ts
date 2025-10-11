import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'date';

const DATA = {
  data: {
    createdAt: '2024-03-05T14:23:45Z',
  },
};

const BASE_DATE = DateTime.fromISO(DATA.data.createdAt).setZone('UTC');


// Tests

describe('"date" module', () => {
  it('op formats values with color support', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:op data.createdAt "day" padding=2 timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('05'));
  });

  // it('now returns the current DateTime respecting timezone', () => {
  //   vi.useFakeTimers();
  //   vi.setSystemTime(new Date('2024-07-08T09:10:11Z'));
  //
  //   try {
  //     const html = getHtml({
  //       modules: MODULE_NAME,
  //       template: '{{#with (date:now timeZone="UTC") as |dt|}}{{ dt.year }}-{{ dt.month }}-{{ dt.day }}{{/with}}',
  //     }).trim();
  //
  //     expect(html).toBe('2024-7-8');
  //   } finally {
  //     vi.useRealTimers();
  //   }
  // });

  it('seconds returns zero-padded seconds', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:seconds data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('45'));
  });

  it('minutes returns zero-padded minutes', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:minutes data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('23'));
  });

  it('hours returns zero-padded hours', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:hours data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('14'));
  });

  it('day returns zero-padded day numbers', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:day data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('05'));
  });

  it('month returns zero-padded month numbers', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:month data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('03'));
  });

  it('monthText returns localized month names', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:monthText data.createdAt lang="fr-FR" nominative=true timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut(BASE_DATE.setLocale('fr-FR').toLocaleString({ month: 'long' }).toLowerCase()));
  });

  it('year returns zero-padded years', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:year data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('2024'));
  });

  it('text respects locale settings', () => {
    const expected = BASE_DATE.setLocale('en-US').toLocaleString();

    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:text data.createdAt lang="en-US" timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut(expected));
  });

  it('unix returns milliseconds without color wrapper', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:unix data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(String(BASE_DATE.toMillis()));
  });

  it('iso returns ISO time strings', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:iso data.createdAt timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(BASE_DATE.toISOTime());
  });

  it('noColor exposes raw values', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date:noColor data.createdAt "month" padding=2 timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe('03');
  });

  it('default helper mirrors the colored base implementation', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ date data.createdAt "day" padding=2 timeZone="UTC" }}',
      data: DATA,
    }).trim();

    expect(html).toBe(mockPut('05'));
  });
});
