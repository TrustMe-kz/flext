import { describe, it, expect } from 'vitest';
import Flext, { PotentialLoopError } from '@flext';

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

  it('treats zeroes and booleans as valid values for required fields', () => {
    const templateWithZeroes = `
      {{!-- @v "1.0.beta3" --}}
      {{!-- @use "put" --}}
      {{!-- @field "data.metrics.count" required --}}
      {{!-- @field "data.flags.enabled" required --}}

      <p>{{ put data.metrics.count "--" }}</p>
      <p>{{ put data.flags.enabled "--" }}</p>
    `;

    const flext = new Flext(templateWithZeroes, {
      data: { metrics: { count: 0 }, flags: { enabled: false } },
    });

    expect(flext.isValid).toBe(true);
    expect(flext.getIsValid({ data: { metrics: { count: null } } })).toBe(false);
  });

  it('merges nested overrides while validating deep objects', () => {
    const template = `
      {{!-- @v "1.0.beta3" --}}
      {{!-- @use "put" --}}
      {{!-- @field "data.org.name" label="Name" required --}}
      {{!-- @field "data.org.contacts.email" label="Email" required --}}

      <p>{{ put data.org.name "--" }}</p>
      <p>{{ put data.org.contacts.email "--" }}</p>
    `;

    const flext = new Flext(template, {
      data: {
        org: { name: 'TrustMe', contacts: { email: 'hello@trustme24.com' } },
      },
    });

    expect(flext.isValid).toBe(true);
    expect(flext.getIsValid({ data: { org: { contacts: { email: '' } } } })).toBe(false);
  });

  it('throws PotentialLoopError when validation depth is insufficient', () => {
    const template = `
      {{!-- @v "1.0.beta3" --}}
      {{!-- @field "data.company.address.city" label="City" required --}}
      {{ data.company.address.city }}
    `;

    const flext = new Flext(template, {
      data: { company: { address: { city: 'Almaty' } } },
    });

    expect(() => flext.getIsValid(null, 1)).toThrow(PotentialLoopError);
  });

  it('validates numeric values and string lengths against @field min/max constraints', () => {
    const template = `
      {{!-- @v "1.0.beta3" --}}
      {{!-- @field "data.metrics.score" type="number" min="10" max="20" --}}
      {{!-- @field "data.profile.username" minLength="4" maxLength="10" --}}

      {{ data.metrics.score }}
      {{ data.profile.username }}
    `;

    const flext = new Flext(template, {
      data: {
        metrics: { score: 15 },
        profile: { username: 'Andrey' },
      },
    });

    expect(flext.isValid).toBe(true);

    const invalidData = {
      data: {
        metrics: { score: 5 },
        profile: { username: 'QA' },
      },
    };

    expect(flext.getIsValid(invalidData)).toBe(false);

    const errors = flext.getValidationErrors(invalidData);
    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain('less than the range');
    expect(errors[0].fieldName).toBe('data.metrics.score');
    expect(errors[1].message).toContain('shorter than the range');
    expect(errors[1].fieldName).toBe('data.profile.username');
  });
});
