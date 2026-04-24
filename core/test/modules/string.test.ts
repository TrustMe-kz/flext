import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'string';

export const TEMPLATE_DATA = {
  data: {
    title: '  Invoice Draft  ',
    personName: 'aNNa maria',
    personTitle: 'старший инженер',
    csv: 'red,green,blue',
    unicodeName: 'әлия жолдас',
    payload: '{"client":{"name":"Anna"},"items":[1,2]}',
    badPayload: '{bad-json}',
    value: 25,
  },
};


// Tests

describe('"string" module', () => {
  it('array splits strings using the default and custom separators', () => {
    const defaultHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (string:array "abc")}}{{ this }};{{/each}}',
    }).trim();

    const customHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (string:array data.csv separator=",")}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(defaultHtml).toBe('a;b;c;');
    expect(customHtml).toBe('red;green;blue;');
  });

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

  it('lower and upper normalize string casing', () => {
    const lowerHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:lower data.personName }}',
      data: TEMPLATE_DATA,
    }).trim();

    const upperHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:upper data.personTitle }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(lowerHtml).toBe('anna maria');
    expect(upperHtml).toBe('СТАРШИЙ ИНЖЕНЕР');
  });

  it('op supports check explicitly', () => {
    const stringHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:op "check" data.title }}',
      data: TEMPLATE_DATA,
    }).trim();

    const nonStringHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:op "check" data.value }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(stringHtml).toBe('true');
    expect(nonStringHtml).toBe('false');
  });

  it('title and capitalize normalize latin multi-word text', () => {
    const titleHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:title data.personName }}',
      data: TEMPLATE_DATA,
    }).trim();

    const capitalizeHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:capitalize data.personName }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(titleHtml).toBe('Anna Maria');
    expect(capitalizeHtml).toBe('ANNa Maria');
  });

  it('name alias mirrors capitalize behavior', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:name data.personName }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('ANNa Maria');
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

  it('slice preserves zero-valued end boundaries', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:slice data.title start=0 end=0 }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('');
  });

  it('slice preserves zero-valued starts', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ string:slice data.title start=0 end=2 }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('');
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

  it('contains, starts and ends return false when no reference matches', () => {
    const containsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:contains data.title "Missing" "Unknown")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const startsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:starts data.title "Invoice" "Report")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const endsHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (string:ends data.title "Done" "Ready")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(containsHtml).toBe('no');
    expect(startsHtml).toBe('no');
    expect(endsHtml).toBe('no');
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

  it('op supports array conversion explicitly', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (string:op "array" data.csv separator=",")}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('red;green;blue;');
  });

  it('throws when trim receives a non-string value', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{ string:trim data.value }}',
      data: TEMPLATE_DATA,
    })).toThrow();
  });

  it('throws when array receives a non-string value', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{#each (string:array data.value)}}{{ this }}{{/each}}',
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
