import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'string';

export const TEMPLATE_DATA = {
  data: {
    title: '  Invoice Draft  ',
    payload: '{"client":{"name":"Anna"},"items":[1,2]}',
    badPayload: '{bad-json}',
    value: 25,
  },
};


// Tests

describe('"string" module', () => {
  it('json parses objects and arrays for downstream template use', () => {
    const objectHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#with (string:json data.payload)}}{{ client.name }}:{{ items.length }}{{/with}}',
      data: TEMPLATE_DATA,
    }).trim();

    const arrayHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (string:json "[1,2,3]")}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(objectHtml).toBe('Anna:2');
    expect(arrayHtml).toBe('1;2;3;');
  });

  it('throws when json receives invalid JSON', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{ string:json data.badPayload }}',
      data: TEMPLATE_DATA,
    })).toThrow();
  });

  it('trim removes surrounding whitespace', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:trim data.title }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('Invoice Draft');
  });

  it('slice supports start and end parameters', () => {
    const withEnd = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:slice data.title start=2 end=9 }}',
      data: TEMPLATE_DATA,
    }).trim();

    const fromStart = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:slice data.title start=10 }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(withEnd).toBe('Invoice');
    expect(fromStart).toBe('Draft');
  });

  it('contains, starts and ends are case-sensitive by default', () => {
    const containsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:contains data.title "invoice")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const startsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:starts data.title "Invoice")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const endsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:ends data.title "Draft")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(containsHtml).toBe('no');
    expect(startsHtml).toBe('no');
    expect(endsHtml).toBe('no');
  });

  it('contains, starts and ends support soft case-insensitive checks', () => {
    const containsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:contains data.title "invoice" soft=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const startsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:starts data.title "  invoice" soft=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const endsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:ends data.title "draft  " soft=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(containsHtml).toBe('yes');
    expect(startsHtml).toBe('yes');
    expect(endsHtml).toBe('yes');
  });

  it('contains, starts and ends accept multiple reference values', () => {
    const containsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:contains data.title "Missing" "Draft")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const startsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:starts data.title "Missing" "  Invoice")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const endsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:ends data.title "Missing" "Draft  ")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(containsHtml).toBe('yes');
    expect(startsHtml).toBe('yes');
    expect(endsHtml).toBe('yes');
  });

  it('check distinguishes strings from other values', () => {
    const stringHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:check data.title }}',
      data: TEMPLATE_DATA,
    }).trim();

    const numberHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:check data.value }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(stringHtml).toBe('true');
    expect(numberHtml).toBe('false');
  });

  it('default helper mirrors op behavior and unknown operations return the operation name', () => {
    const defaultHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string "trim" data.title }}',
      data: TEMPLATE_DATA,
    }).trim();

    const unknownHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:op "unknown" data.title }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(defaultHtml).toBe('Invoice Draft');
    expect(unknownHtml).toBe('unknown');
  });

  it('throws when trim receives a non-string value', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{ string:trim data.value }}',
      data: TEMPLATE_DATA,
    })).toThrow();
  });

  it('works inside mixed module expressions', () => {
    const html = getHtml({
      modules: [ MODULE_NAME, 'put', 'cond' ],
      template: '{{#if (string:contains data.title "invoice" soft=true)}}{{ put:noColor (string:trim data.title) }}{{else}}missing{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('Invoice Draft');
  });
});
