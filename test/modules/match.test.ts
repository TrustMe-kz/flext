import { describe, it, expect } from 'vitest';
import { getHtml } from '@test-lib';


// Constants

export const MODULE_NAME = 'match';


// Tests

describe('"match" module', () => {
  it('renders the matching case content', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "ok"}}OK!{{/match:case}}{{#match:case "pending"}}Pending{{/match:case}}{{#match:fallback}}Fail...{{/match:fallback}}{{/match}}',
      data: { data: { status: 'ok' } },
    }).trim();
    console.log('html');
    console.log(html);

    expect(html).toBe('OK!');
  });

  it('renders the fallback when no case matches', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "ok"}}OK!{{/match:case}}{{#match:fallback}}Fail...{{/match:fallback}}{{/match}}',
      data: { data: { status: 'error' } },
    }).trim();

    expect(html).toBe('Fail...');
  });

  it('stops evaluation after the first matching case', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "ok"}}First{{/match:case}}{{#match:case "ok"}}Second{{/match:case}}{{#match:fallback}}Fallback{{/match:fallback}}{{/match}}',
      data: { data: { status: 'ok' } },
    }).trim();

    expect(html).toBe('First');
  });

  it('allows providing multiple values to a single case', () => {
    const html = getHtml({
      modules: MODULE_NAME,
      template: '{{#match data.status}}{{#match:case "pending" "processing"}}Working...{{/match:case}}{{#match:fallback}}Done{{/match:fallback}}{{/match}}',
      data: { data: { status: 'processing' } },
    }).trim();
    console.log('html');
    console.log(html);

    expect(html).toBe('Working...');
  });
});
