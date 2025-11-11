import { describe, it, expect } from 'vitest';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'math';


// Tests

describe('"math" module', () => {
  it('op evaluates requested operations and falls back to Math API', () => {
    const plusResult = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:op 3 "plus" 5 }}',
    }).trim();

    const sqrtResult = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:op "sqrt" 9 }}',
    }).trim();

    expect(plusResult).toBe(mockPut('8'));
    expect(sqrtResult).toBe(mockPut('3'));
  });

  it('plus adds two values', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:plus 3 4 }}',
    }).trim();

    expect(html).toBe(mockPut('7'));
  });

  it('minus subtracts the second value from the first', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:minus 10 3 }}',
    }).trim();

    expect(html).toBe(mockPut('7'));
  });

  it('multiply multiplies the provided values', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:multiply 6 7 }}',
    }).trim();

    expect(html).toBe(mockPut('42'));
  });

  it('divide divides the first value by the second', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:divide 22 7 }}',
    }).trim();

    expect(html).toBe(mockPut(String(22 / 7)));
  });

  it('intDivide returns the integer remainder', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:intDivide 7 2 }}',
    }).trim();

    expect(html).toBe(mockPut('1'));
  });

  it('power raises the first value to the power of the second', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:power 2 5 }}',
    }).trim();

    expect(html).toBe(mockPut('32'));
  });

  it('round supports default rounding and explicit modes', () => {
    const defaultRound = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:round 2.6 }}',
    }).trim();

    const floorRound = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:round 2.9 "floor" }}',
    }).trim();

    expect(defaultRound).toBe(mockPut('3'));
    expect(floorRound).toBe(mockPut('2'));
  });

  it('sqrt calculates the square root', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:sqrt 16 }}',
    }).trim();

    expect(html).toBe(mockPut('4'));
  });

  it('cbrt calculates the cubic root', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:cbrt 27 }}',
    }).trim();

    expect(html).toBe(mockPut('3'));
  });

  it('abs returns the absolute value', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:abs -42 }}',
    }).trim();

    expect(html).toBe(mockPut('42'));
  });

  it('noColor returns raw numeric output', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:noColor 7 "minus" 2 }}',
    }).trim();

    expect(html).toBe('5');
  });

  it('default helper mirrors op with colored output', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math 3 "plus" 5 }}',
    }).trim();

    expect(html).toBe(mockPut('8'));
  });

  it('mul alias matches multiply behavior', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math:mul 4 3 }}',
    }).trim();

    expect(html).toBe(mockPut('12'));
  });

  it('respects custom color overrides on colored helpers', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{ math 2 "power" 3 color="text-green-600" }}',
    }).trim();

    expect(html).toBe(mockPut('8', 'text-green-600'));
  });

  it('round throws for unsupported rounding modes', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{ math:round 5.2 "towardZero" }}',
    })).toThrow(/Unknown operation/i);
  });
});
