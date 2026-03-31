import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'number';


// Tests

describe('"number" module', () => {
  it('default helper converts inputs with Number()', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number "007.5" }}',
    }).trim();

    expect(html).toBe('7.5');
  });

  it('text renders a localized string when lang is provided explicitly', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:text 42 lang="ru-RU" }}',
    }).trim();

    expect(html).toBe('сорок два');
  });

  it('text falls back to Flext @lang when helper-level lang is missing', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{!-- @lang "ru-RU" --}}{{ number:text 7 }}',
    }).trim();

    expect(html).toBe('семь');
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

    const strictNumber = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:check data.value strict=true }}',
      data: { data: { value: 12 } },
    }).trim();

    expect(strictNumber).toBe('true');
  });

  it('op returns the raw primitive without decorations', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:op "0042" }}',
    }).trim();

    expect(html).toBe('42');
  });

  it('maps extended locale codes to written-number equivalents', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:text 15 lang="pt-BR" }}',
    }).trim();

    expect(html).toBe('quinze');
  });

  it('preserves zero-like values without triggering fallbacks', () => {
    const zeroHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ number 0 fallback="--" }}',
    }).trim();

    const falseHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{ number false fallback="**" }}',
    }).trim();

    expect(zeroHtml).toBe('0');
    expect(falseHtml).toBe('0');
  });

  it('supports custom locale maps like kk-KZ', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number:text 21 lang="kk-KZ" }}',
    }).trim();

    expect(html).toBe('жиырма бір');
  });

  it('surfaces NaN for missing inputs so templates handle fallbacks explicitly', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ number data.amount fallback="n/a" }}',
      data: { data: {} },
    }).trim();

    expect(html).toBe('NaN');
  });
});
