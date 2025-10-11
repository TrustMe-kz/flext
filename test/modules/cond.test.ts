import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'cond';


// Tests

describe('"cond" module', () => {
  it('evaluates strict equality by default', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond data.status "equal" "ok")}}OK{{else}}Fail{{/if}}',
      data: { data: { status: 'ok' } },
    }).trim();

    expect(html).toBe('OK');
  });

  it('supports soft comparisons via the named argument', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond data.count "equal" "5" soft=true)}}Match{{else}}Mismatch{{/if}}',
      data: { data: { count: 5 } },
    }).trim();

    expect(html).toBe('Match');
  });

  it('exposes dedicated helpers for comparisons', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:greater data.value 10)}}Greater{{else}}Lower{{/if}}',
      data: { data: { value: 42 } },
    }).trim();

    expect(html).toBe('Greater');
  });

  it('allows combining helper results through logical operations', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#if (cond:or (cond:equal data.state "pending") (cond:equal data.state "processing"))}}Working{{else}}Idle{{/if}}',
      data: { data: { state: 'processing' } },
    }).trim();

    expect(html).toBe('Working');
  });
});
