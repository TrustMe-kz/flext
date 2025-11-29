import { describe, it, expect } from 'vitest';
import { getHtml, mockPut } from '@test-lib';


describe('standard template scenarios', () => {
  const template = '{{#match data.status}}{{#match:case "ok"}}{{#if (cond:greater (math:noColor data.total "minus" data.completed) 0)}}Remaining: {{ math data.total "minus" data.completed }}{{else}}Completed at {{ date:noColor data.completedAt "iso" timeZone="UTC" }}{{/if}}{{/match:case}}{{#match:fallback}}Pending as of {{ date:noColor data.completedAt "iso" timeZone="UTC" }}{{/match:fallback}}{{/match}}';
  const data = {
    data: {
      status: 'ok',
      total: 10,
      completed: 3,
      completedAt: '2024-03-05T14:23:45Z',
    },
  };

  it('renders a multi-module flow for completed progress', () => {
    const html = getHtml({
      modules: [ 'match', 'cond', 'math', 'date' ],
      template: template,
      data: data,
    }).trim();

    expect(html).toBe(`Remaining: ${mockPut('7')}`);
  });

  it('falls back to pending branch when status does not match', () => {
    const html = getHtml({
      modules: [ 'match', 'cond', 'math', 'date' ],
      template: template,
      data: { data: { ...data.data, status: 'pending' } },
    }).trim();

    expect(html).toBe('Pending as of 14:23:45.000Z');
  });

  it('marks the flow as complete when remaining items drop to zero', () => {
    const html = getHtml({
      modules: [ 'match', 'cond', 'math', 'date' ],
      template: template,
      data: { data: { ...data.data, completed: data.data.total } },
    }).trim();

    expect(html).toBe('Completed at 14:23:45.000Z');
  });
});
