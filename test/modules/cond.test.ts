import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'cond';


// Tests

describe('"cond" module', () => {
  it('op evaluates strict comparisons and honors soft mode', () => {
    const strictHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:op data.status "equal" "ok")}}OK{{else}}Fail{{/if}}',
      data: { data: { status: 'ok' } },
    }).trim();

    const softHtml = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:op data.count "equal" "5" soft=true)}}Match{{else}}Mismatch{{/if}}',
      data: { data: { count: 5 } },
    }).trim();

    expect(strictHtml).toBe('OK');
    expect(softHtml).toBe('Match');
  });

  it('equal checks for strict equality', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:equal data.state "ready")}}Yes{{else}}No{{/if}}',
      data: { data: { state: 'ready' } },
    }).trim();

    expect(html).toBe('Yes');
  });

  it('notEqual detects different values', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:notEqual data.status "error")}}Safe{{else}}Danger{{/if}}',
      data: { data: { status: 'ok' } },
    }).trim();

    expect(html).toBe('Safe');
  });

  it('and returns true when both operands are truthy', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:and (cond:equal data.flag "on") (cond:equal data.mode "auto"))}}Active{{else}}Inactive{{/if}}',
      data: { data: { flag: 'on', mode: 'auto' } },
    }).trim();

    expect(html).toBe('Active');
  });

  it('or returns true if any operand is truthy', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:or (cond:equal data.stage "draft") (cond:equal data.stage "pending"))}}Locked{{else}}Open{{/if}}',
      data: { data: { stage: 'pending' } },
    }).trim();

    expect(html).toBe('Locked');
  });

  it('greater compares numbers using strict greater-than', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:greater data.score 70)}}Passed{{else}}Retry{{/if}}',
      data: { data: { score: 88 } },
    }).trim();

    expect(html).toBe('Passed');
  });

  it('less compares numbers using strict less-than', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:less data.score 50)}}Low{{else}}High{{/if}}',
      data: { data: { score: 40 } },
    }).trim();

    expect(html).toBe('Low');
  });

  it('noColor mirrors op for boolean output', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:noColor data.status "equal" "ok")}}OK{{else}}Fail{{/if}}',
      data: { data: { status: 'ok' } },
    }).trim();

    expect(html).toBe('OK');
  });

  it('default helper matches the base op behavior', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond data.status "equal" "ok")}}OK{{else}}Fail{{/if}}',
      data: { data: { status: 'ok' } },
    }).trim();

    expect(html).toBe('OK');
  });

  it('not negates the provided value', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:not data.online)}}Offline{{else}}Online{{/if}}',
      data: { data: { online: false } },
    }).trim();

    expect(html).toBe('Offline');
  });

  it('and supports more than two operands', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:and data.a data.b data.c)}}Ready{{else}}Not yet{{/if}}',
      data: { data: { a: true, b: 1, c: 'ok' } },
    }).trim();

    expect(html).toBe('Ready');
  });

  it('soft comparisons treat numeric strings as numbers for notEqual', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:op data.count "notEqual" "5" soft=true)}}Different{{else}}Equal{{/if}}',
      data: { data: { count: 5 } },
    }).trim();

    expect(html).toBe('Equal');
  });

  it('throws when an unsupported operation name is provided', () => {
    expect(() => getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:op data.state "unknown" "ready")}}OK{{/if}}',
      data: { data: { state: 'ready' } },
    })).toThrow(/Unknown operation/i);
  });
});
