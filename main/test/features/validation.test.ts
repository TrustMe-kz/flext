import { describe, it, expect } from 'vitest';
import Flext, { PotentialLoopError } from '@flext';

describe('Flext validation workflow', () => {
  const template = `
    {{!-- @syntax "standard" --}}
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
      {{!-- @syntax "standard" --}}
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
      {{!-- @syntax "standard" --}}
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
      {{!-- @syntax "standard" --}}
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
      {{!-- @syntax "standard" --}}
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

  it('reports max and maxLength validation failures', () => {
    const template = `
      {{!-- @syntax "standard" --}}
      {{!-- @field "data.metrics.score" type="number" min="10" max="20" --}}
      {{!-- @field "data.profile.username" minLength="4" maxLength="10" --}}

      {{ data.metrics.score }}
      {{ data.profile.username }}
    `;

    const flext = new Flext(template);
    const errors = flext.getValidationErrors({
      data: {
        metrics: { score: 25 },
        profile: { username: 'VeryLongUsername' },
      },
    });

    expect(errors).toHaveLength(2);
    expect(errors[0].message).toContain('greater than the range');
    expect(errors[0].fieldName).toBe('data.metrics.score');
    expect(errors[1].message).toContain('longer than the range');
    expect(errors[1].fieldName).toBe('data.profile.username');
  });

  it('validates date ranges from runtime fields and string min/max shorthand consistently', () => {
    const flext = new Flext(`
      {{ data.schedule.startDate }}
      {{ data.profile.code }}
    `).setFields([
      {
        type: 'date',
        name: 'data.schedule.startDate',
        min: new Date('2024-01-10T00:00:00.000Z'),
        max: new Date('2024-01-20T00:00:00.000Z'),
        isRequired: false,
      },
      {
        type: 'string',
        name: 'data.profile.code',
        min: 3,
        max: 5,
        isRequired: false,
      },
    ]);

    const earlyErrors = flext.getValidationErrors({
      data: {
        schedule: { startDate: new Date('2024-01-05T00:00:00.000Z') },
        profile: { code: 'AB' },
      },
    });

    const lateErrors = flext.getValidationErrors({
      data: {
        schedule: { startDate: new Date('2024-01-25T00:00:00.000Z') },
        profile: { code: 'TOOLONG' },
      },
    });

    expect(earlyErrors).toHaveLength(2);
    expect(earlyErrors[0].fieldName).toBe('data.schedule.startDate');
    expect(earlyErrors[0].message).toContain('less than the range');
    expect(earlyErrors[1].fieldName).toBe('data.profile.code');
    expect(earlyErrors[1].message).toContain('shorter than the range');

    expect(lateErrors).toHaveLength(2);
    expect(lateErrors[0].fieldName).toBe('data.schedule.startDate');
    expect(lateErrors[0].message).toContain('greater than the range');
    expect(lateErrors[1].fieldName).toBe('data.profile.code');
    expect(lateErrors[1].message).toContain('longer than the range');
  });
});
