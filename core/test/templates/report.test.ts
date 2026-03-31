import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { getHtml } from '@test-lib';


// Functions

const inline = (val: string): string => val.replace(/\s+/g, ' ').trim();


// Tests

describe('report summary template', () => {
  const template = `
    <section class="space-y-2">
      <h2 class="text-xl font-semibold">
        {{ put data.report.title "Untitled report" }}
      </h2>

      <p>
        Remaining:
        {{ number:text (math:op data.report.total "minus" data.report.completed) lang="en" }}
      </p>

      {{#match data.report.status}}
        {{#match:case "done"}}
          Completed on {{ date data.report.completedAt "iso" timeZone="UTC" }}
        {{/match:case}}
        {{#match:fallback}}
          {{#if (cond:greater data.report.total data.report.completed)}}
            Needs attention
          {{else}}
            Ready for review
          {{/if}}
        {{/match:fallback}}
      {{/match}}
    </section>
  `;

  const modules = [ 'put', 'number', 'math', 'cond', 'match', 'date' ];

  const baseData = {
    data: {
      report: {
        title: 'May summary',
        total: 8,
        completed: 6,
        completedAt: '2024-05-29T08:00:00Z',
        status: 'done',
      },
    },
  };

  it('renders a completed report with spelled-out remainder and ISO timestamps', () => {
    const html = inline(getHtml({
      modules,
      template,
      data: baseData,
    }));

    const completedAt = DateTime.fromISO(baseData.data.report.completedAt).setZone('UTC').toISOTime();

    expect(html).toContain(`Remaining: two`);
    expect(html).toContain(`Completed on ${completedAt}`);
  });

  it('falls back to contextual status when the report is still in progress', () => {
    const attentionHtml = inline(getHtml({
      modules,
      template,
      data: {
        data: {
          report: {
            ...baseData.data.report,
            status: 'draft',
            total: 9,
            completed: 6,
          },
        },
      },
    }));

    const readyHtml = inline(getHtml({
      modules,
      template,
      data: {
        data: {
          report: {
            ...baseData.data.report,
            status: 'draft',
            completed: 8,
            total: 8,
          },
        },
      },
    }));

    expect(attentionHtml).toContain(`Remaining: three`);
    expect(attentionHtml).toContain('Needs attention');
    expect(readyHtml).toContain('Ready for review');
  });
});
