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
});
