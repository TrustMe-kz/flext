import { describe, it, expect } from 'vitest';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'number';


// Tests

describe('"number" module', () => {
  it('default helper converts inputs with Number() and decorates the result', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number "007.5" }}',
    }).trim();

    expect(html).toBe(mockPut('7.5'));
  });

  it('text renders a localized string when lang is provided explicitly', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:text 42 lang="ru-RU" }}',
    }).trim();

    expect(html).toBe(mockPut('сорок два'));
  });

  it('text falls back to Flext @lang when helper-level lang is missing', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{!-- @lang "ru-RU" --}}{{ number:text 7 }}',
    }).trim();

    expect(html).toBe(mockPut('семь'));
  });

  it('check distinguishes strict checks from the soft mode', () => {
    const strictResult = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:check data.value strict=true }}',
      data: { data: { value: '12' } },
    }).trim();

    const softResult = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:check data.value }}',
      data: { data: { value: '12' } },
    }).trim();

    expect(strictResult).toBe('false');
    expect(softResult).toBe('true');
  });

  it('noColor returns the raw primitive without decorations', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:noColor "0042" }}',
    }).trim();

    expect(html).toBe('42');
  });

  it('maps extended locale codes to written-number equivalents', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:text 15 lang="pt-BR" }}',
    }).trim();

    expect(html).toBe(mockPut('quinze'));
  });
});
