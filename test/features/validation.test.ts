import { describe, it, expect } from 'vitest';
import Flext from '@flext';

describe('Flext validation workflow', () => {
  const template = `
    {{!-- @v "1.0.beta3" --}}
    {{!-- @use "put" --}}
    {{!-- @field "data.client.fullName" label="ФИО" required --}}
    {{!-- @field "data.client.email" label="Email" --}}
    {{!-- @field "data.contract.number" label="Номер договора" required --}}

    <p>{{ put data.client.fullName "--" }}</p>
    <p>{{ put data.client.email "--" }}</p>
    <p>{{ put data.contract.number "--" }}</p>
  `;

  it('getIsValid honors required fields while merging base data with overrides', () => {
    const flext = new Flext(template, {
      data: {
        client: { fullName: 'Еркебулан Алибеков', email: 'erke@mail.kz' },
        contract: { number: '65/24' },
      },
    });

    expect(flext.isValid).toBe(true);
    expect(flext.getIsValid({ data: { client: { fullName: 'Test' } } })).toBe(false);

    const patchedData = {
      data: {
        client: { fullName: 'Test', email: 'override@mail.kz' },
        contract: { number: '99/26' },
      },
    };

    expect(flext.getIsValid(patchedData)).toBe(true);
  });
});

