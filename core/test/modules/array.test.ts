import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'array';

export const TEMPLATE_DATA = {
  data: {
    tags: [ 'urgent', 'review', 'done' ],
    emptyTags: [],
    mixed: [ 1, '2', true ],
    csvTags: [ 'urgent', 'review', 'done' ],
    users: [
      { profile: { name: 'Anna' }, role: 'admin' },
      { profile: { name: 'Boris' }, role: 'manager' },
    ],
    selectedUser: { profile: { name: 'Anna' }, role: 'admin' },
    missingUser: { profile: { name: 'Dina' }, role: 'editor' },
    duplicateTags: [ 'urgent', 'review', 'urgent', 'done', 'review' ],
    duplicateUsers: [],
    extraTags: [ 'archived', 'final' ],
    label: 'not-array',
    objectValue: { label: 'not-array' },
  },
};


// Tests

describe('"array" module', () => {
  TEMPLATE_DATA.data.duplicateUsers = [
    TEMPLATE_DATA.data.selectedUser,
    TEMPLATE_DATA.data.selectedUser,
    TEMPLATE_DATA.data.missingUser,
  ];

  it('length and len return the array length', () => {
    const lengthHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:length data.tags }}',
      data: TEMPLATE_DATA,
    }).trim();

    const lenHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:len data.tags }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(lengthHtml).toBe('3');
    expect(lenHtml).toBe('3');
  });

  it('length returns zero for empty arrays', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:length data.emptyTags }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('0');
  });

  it('destruct extracts nested properties from object arrays', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:destruct data.users "profile.name")}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('Anna;Boris;');
  });

  it('reverse returns a reversed array without mutating the original data', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:reverse data.tags)}}{{ this }};{{/each}}|{{#each data.tags}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('done;review;urgent;|urgent;review;done;');
  });

  it('string joins array items with the default and custom separators', () => {
    const defaultHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:string data.csvTags }}',
      data: TEMPLATE_DATA,
    }).trim();

    const customHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:string data.csvTags separator=", " }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(defaultHtml).toBe('urgent review done');
    expect(customHtml).toBe('urgent, review, done');
  });

  it('empty distinguishes empty arrays from populated arrays', () => {
    const emptyHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:empty data.emptyTags }}',
      data: TEMPLATE_DATA,
    }).trim();

    const filledHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:empty data.tags }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(emptyHtml).toBe('true');
    expect(filledHtml).toBe('false');
  });

  it('slice supports start and end parameters', () => {
    const withEnd = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:slice data.tags start=1 end=3)}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    const fromStart = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:slice data.tags start=1)}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(withEnd).toBe('review;done;');
    expect(fromStart).toBe('review;done;');
  });

  it('slice preserves zero-valued boundaries', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:slice data.tags start=0 end=0)}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('');
  });

  it('contains finds primitive and object values', () => {
    const primitiveHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.tags "review")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const objectHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.users data.selectedUser)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(primitiveHtml).toBe('yes');
    expect(objectHtml).toBe('yes');
  });

  it('contains supports strict primitive matching', () => {
    const softHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.mixed "1")}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const strictHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.mixed "1" strict=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(softHtml).toBe('no');
    expect(strictHtml).toBe('no');
  });

  it('contains supports strict reference matching for objects', () => {
    const sameRefHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.duplicateUsers data.selectedUser strict=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const clonedRefHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.users data.missingUser strict=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(sameRefHtml).toBe('yes');
    expect(clonedRefHtml).toBe('no');
  });

  it('contains checks all requested values when all=true', () => {
    const validHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.tags "urgent" "done" all=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    const invalidHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.users data.selectedUser data.missingUser all=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(validHtml).toBe('yes');
    expect(invalidHtml).toBe('no');
  });

  it('op returns first and last boundary items and tolerates empty arrays', () => {
    const firstHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:op "first" data.tags }}',
      data: TEMPLATE_DATA,
    }).trim();

    const lastHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:op "last" data.tags }}',
      data: TEMPLATE_DATA,
    }).trim();

    const emptyFirstHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:op "first" data.emptyTags }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(firstHtml).toBe('urgent');
    expect(lastHtml).toBe('done');
    expect(emptyFirstHtml).toBe('');
  });

  it('concat merges multiple arrays in order', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:concat data.tags data.extraTags data.emptyTags)}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('urgent;review;done;archived;final;');
  });

  it('concat does not mutate the original arrays', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:concat data.tags data.extraTags)}}{{ this }};{{/each}}|{{#each data.tags}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('urgent;review;done;archived;final;|urgent;review;done;');
  });

  it('unique removes duplicate primitive values but keeps unique object references', () => {
    const primitiveHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:unique data.duplicateTags)}}{{ this }};{{/each}}',
      data: TEMPLATE_DATA,
    }).trim();

    const objectHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:length (array:unique data.duplicateUsers) }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(primitiveHtml).toBe('urgent;review;done;');
    expect(objectHtml).toBe('2');
  });

  it('contains supports loose matching when all=true across primitive types', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (array:contains data.mixed 1 "2" true all=true)}}yes{{else}}no{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('yes');
  });

  it('check distinguishes arrays from other values', () => {
    const arrayHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:check data.tags }}',
      data: TEMPLATE_DATA,
    }).trim();

    const stringHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:check data.label }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(arrayHtml).toBe('true');
    expect(stringHtml).toBe('false');
  });

  it('default helper mirrors op behavior', () => {
    const defaultHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ array "length" data.tags }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(defaultHtml).toBe('3');
  });

  it('default helper returns arrays directly for new operations', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ array:op "first" (array:concat data.tags data.extraTags) }}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('urgent');
  });

  it('returns empty output for missing array length', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{ array:length data.missing }}',
      data: TEMPLATE_DATA,
    })).toThrow();
  });

  it('throws when slice is requested for a non-array object', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{ array:slice data.objectValue start=1 }}',
      data: TEMPLATE_DATA,
    })).toThrow();
  });

  it('throws when concat receives a non-array argument', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:concat data.tags data.label)}}{{ this }}{{/each}}',
      data: TEMPLATE_DATA,
    })).toThrow(/not an array/i);
  });

  it('throws when string receives a non-array value', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{ array:string data.label }}',
      data: TEMPLATE_DATA,
    })).toThrow(/not an array/i);
  });

  it('throws when destruct cannot walk a nested path', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{#each (array:destruct data.users "profile.missing.value")}}{{ this }}{{/each}}',
      data: TEMPLATE_DATA,
    })).toThrow();
  });

  it('works inside mixed module expressions', () => {
    const html = getHtml({
      modules: [ MODULE_NAME, 'put', 'cond' ],
      template: '{{#if (array:contains data.tags "urgent")}}{{ put:noColor (array:length data.tags) }}{{else}}none{{/if}}',
      data: TEMPLATE_DATA,
    }).trim();

    expect(html).toBe('3');
  });
});
