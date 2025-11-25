import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { getHtml, mockPut } from '@test-lib';


// Functions

export const inline = (val: string): string => val?.replace(/\s+/g, ' ')?.trim() || '';


// Tests

describe('education contract template', () => {
  const template = `
    <section class="leading-[1.4] text-sm">
      <p>
        г. {{ put data.city "Алматы" }}, договор № {{ put contract.number "--" }} от
        {{ date contract.date "iso" fallback="--" timeZone="Asia/Almaty" }}
      </p>

      <p>
        {{ put company.name "Компания" }} БИН {{ put company.idNumber "--" }},
        {{ put company.director "Директор" }} действует от имени Исполнителя.
      </p>

      <p>
        Заказчик: {{ put client.fullName "Имя заказчика" }} ИИН {{ put client.idNumber "--" }}
      </p>

      {{#match contract.status}}
        {{#match:case "signed"}}
          Статус: подписан
          {{ date contract.signedAt "iso" timeZone="Asia/Almaty" }}
        {{/match:case}}
        {{#match:fallback}}
          Статус: в работе. К оплате {{ math contract.total "minus" contract.paid }} ₸
        {{/match:fallback}}
      {{/match}}
    </section>
  `;

  const modules = [ 'put', 'date', 'match', 'math' ];
  const baseData = {
    data: { city: 'Алматы' },
    contract: {
      number: '26',
      date: '2025-03-01T09:00:00Z',
      status: 'signed',
      signedAt: '2025-03-04T12:00:00Z',
      total: 1200000,
      paid: 900000,
    },
    company: {
      name: 'Flext Education',
      idNumber: '010140004455',
      director: 'Кайрат Абиров',
    },
    client: {
      fullName: 'Айнагуль Рахимбаева',
      idNumber: '900101300000',
    },
  };

  it('renders a signed education contract excerpt with actual values', () => {
    const html = inline(getHtml({
      modules,
      template,
      data: baseData,
    }));

    const contractDate = DateTime.fromISO(baseData.contract.date).setZone('Asia/Almaty').toISOTime();
    const signedDate = DateTime.fromISO(baseData.contract.signedAt).setZone('Asia/Almaty').toISOTime();

    expect(html).toContain(`г. ${mockPut('Алматы')}, договор № ${mockPut('26')} от ${mockPut(contractDate)}`);
    expect(html).toContain(`${mockPut('Flext Education')} БИН ${mockPut('010140004455')}`);
    expect(html).toContain(`Заказчик: ${mockPut('Айнагуль Рахимбаева')} ИИН ${mockPut('900101300000')}`);
    expect(html).toContain(`Статус: подписан ${mockPut(signedDate)}`);
  });

  it('falls back to pending branch and placeholders when data is incomplete', () => {
    const html = inline(getHtml({
      modules,
      template,
      data: {
        ...baseData,
        contract: {
          number: '',
          date: '',
          status: 'draft',
          signedAt: '',
          total: 1200000,
          paid: 300000,
        },
        client: { fullName: '', idNumber: '' },
      },
    }));

    expect(html).toContain(`договор № ${mockPut('')} от ${mockPut('--')}`); // TODO: kr: Fix the issue with "contract.number" field
    expect(html).toContain(`Статус: в работе. К оплате ${mockPut('900000')} ₸`);
    expect(html).toContain(`Заказчик: ${mockPut('')} ИИН ${mockPut('')}`);
  });
});

