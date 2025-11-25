import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'match';


// Tests

describe('"match" module', () => {
  it('case renders content for the first matching value', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "ok"}}Primary{{/match:case}}{{#match:case "ok"}}Secondary{{/match:case}}{{#match:fallback}}Fallback{{/match:fallback}}{{/match}}',
      data: { data: { status: 'ok' } },
    }).trim();

    expect(html).toBe('Primary');
  });

  it('fallback runs when no case succeeds', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "ok"}}OK!{{/match:case}}{{#match:fallback}}Fail...{{/match:fallback}}{{/match}}',
      data: { data: { status: 'error' } },
    }).trim();

    expect(html).toBe('Fail...');
  });

  it('default helper stores the value and drives the evaluation flow', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "pending" "processing"}}Working...{{/match:case}}{{#match:fallback}}Done{{/match:fallback}}{{/match}}',
      data: { data: { status: 'processing' } },
    }).trim();

    expect(html).toBe('Working...');
  });

  it('case supports multiple values inside a single block', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "draft" "pending"}}Queue{{/match:case}}{{#match:fallback}}Live{{/match:fallback}}{{/match}}',
      data: { data: { status: 'pending' } },
    }).trim();

    expect(html).toBe('Queue');
  });

  it('state is isolated between consecutive match blocks', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.first}}{{#match:case "A"}}One{{/match:case}}{{#match:fallback}}Nope{{/match:fallback}}{{/match}}{{#match data.second}}{{#match:case "B"}}Two{{/match:case}}{{#match:fallback}}Nope{{/match:fallback}}{{/match}}',
      data: { data: { first: 'A', second: 'B' } },
    }).trim();

    expect(html).toBe('OneTwo');
  });

  it('passes the stored value into fallback blocks', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:fallback}}{{ data.status }}{{/match:fallback}}{{/match}}',
      data: { data: { status: 'delayed' } },
    }).trim();

    expect(html).toBe('delayed');
  });
});
