import { describe, it, expect } from 'vitest';
import Flext, { PotentialLoopError } from '@flext';

describe('Flext data model and field options', () => {
  it('merges @group, @field and @option metadata into the model tree', () => {
    const template = `
      {{!-- @use "put" --}}
      {{!-- @use "math" --}}
      {{!-- @group "data.company" label="Компания" --}}
      {{!-- @field "data.company.name" label="Название компании" required --}}
      {{!-- @field "data.contract.type" label="Тип договора" --}}
      {{!-- @option "online" for="data.contract.type" label="Онлайн" value="online" --}}

      <h2>{{ put data.company.name "--" }}</h2>
      <p>{{ put data.contract.type "--" }}</p>
    `;

    const flext = new Flext(template);
    const model = flext.model;

    expect(flext.fields).toEqual([
      {
        type: 'object',
        name: 'data.company',
        label: 'Компания',
        hint: null,
        min: null,
        max: null,
        minLength: null,
        maxLength: null,
        descr: null,
        order: null,
        value: null,
        isRequired: false,
        extra: {
          macroName: 'group',
          absoluteOrder: 0,
        },
      },
      {
        type: 'string',
        name: 'data.company.name',
        label: 'Название компании',
        hint: null,
        min: null,
        max: null,
        minLength: null,
        maxLength: null,
        descr: null,
        order: null,
        value: null,
        isRequired: true,
        extra: {
          macroName: 'field',
          absoluteOrder: 1,
        },
      },
      {
        type: 'string',
        name: 'data.contract.type',
        label: 'Тип договора',
        hint: null,
        min: null,
        max: null,
        minLength: null,
        maxLength: null,
        descr: null,
        order: null,
        options: [
          {
            type: 'string',
            name: 'online',
            fieldName: 'data.contract.type',
            label: 'Онлайн',
            descr: null,
            value: 'online',
            isDisabled: false,
          },
        ],
        value: null,
        isRequired: false,
        extra: {
          macroName: 'field',
          absoluteOrder: 2,
        },
      },
    ]);

    expect(model).toEqual([
      {
        type: 'object',
        name: 'data',
        label: null,
        hint: null,
        min: null,
        max: null,
        minLength: null,
        maxLength: null,
        order: null,
        options: null,
        isRequired: false,
        extra: {
          fieldName: 'data',
        },
        $: [
          {
            type: 'object',
            name: 'company',
            label: 'Компания',
            hint: null,
            min: null,
            max: null,
            minLength: null,
            maxLength: null,
            order: null,
            options: null,
            isRequired: false,
            extra: {
              fieldName: 'data.company',
            },
            $: [
              {
                type: 'string',
                name: 'name',
                label: 'Название компании',
                hint: null,
                min: null,
                max: null,
                minLength: null,
                maxLength: null,
                order: null,
                options: null,
                isRequired: true,
                extra: {
                  fieldName: 'data.company.name',
                },
                $: [],
              },
            ],
          },
          {
            type: 'object',
            name: 'contract',
            label: null,
            hint: null,
            min: null,
            max: null,
            minLength: null,
            maxLength: null,
            order: null,
            options: null,
            isRequired: false,
            extra: {
              fieldName: 'data.contract',
            },
            $: [
              {
                type: 'string',
                name: 'type',
                label: 'Тип договора',
                hint: null,
                min: null,
                max: null,
                minLength: null,
                maxLength: null,
                order: null,
                options: [
                  {
                    type: 'string',
                    name: 'online',
                    fieldName: 'data.contract.type',
                    label: 'Онлайн',
                    descr: null,
                    value: 'online',
                    isDisabled: false,
                  },
                ],
                isRequired: false,
                extra: {
                  fieldName: 'data.contract.type',
                },
                $: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('persists zero as an explicit order value inside the model', () => {
    const template = `
      {{!-- @field "data.zero" order="0" label="Zero" --}}
      {{ data.zero }}
    `;

    const flext = new Flext(template);
    const [ data ] = flext.model;
    const [ zero ] = data.$;

    expect(flext.fields[0].order).toBe(0);
    expect(zero.order).toBe(0);
    expect(flext.fields[0].extra?.absoluteOrder).toBe(0);
  });

  it('orders metadata nodes by explicit order with absolute order as a tiebreaker', () => {
    const template = `
      {{!-- @group "data.user" label="User" order="5" --}}
      {{!-- @field "data.user.lastName" label="Last" order="2" --}}
      {{!-- @field "data.user.firstName" label="First" order="1" --}}
      {{!-- @field "data.user.middleName" label="Middle" order="2" --}}
      {{!-- @field "data.user.suffix" label="Suffix" --}}
      {{!-- @group "data.meta" label="Meta" order="0" --}}
      {{!-- @field "data.meta.updatedAt" type="date" order="2" --}}
      {{!-- @field "data.meta.createdAt" type="date" order="0" --}}
      {{ data.user.firstName }} {{ data.user.lastName }} {{ data.user.middleName }} {{ data.user.suffix }} {{ data.meta.updatedAt }} {{ data.meta.createdAt }}
    `;

    const flext = new Flext(template);
    const [ data ] = flext.model;
    const [ meta, user ] = data.$;

    expect([ data.name, meta.name, user.name ]).toEqual([ 'data', 'meta', 'user' ]);
    expect(user.$.map(node => node.name)).toEqual([ 'firstName', 'lastName', 'middleName', 'suffix' ]);
    expect(meta.$.map(node => node.name)).toEqual([ 'createdAt', 'updatedAt' ]);
    expect(user.$.map(node => node.extra?.fieldName)).toEqual([
      'data.user.firstName',
      'data.user.lastName',
      'data.user.middleName',
      'data.user.suffix',
    ]);
    expect(flext.fields.find(f => f.name === 'data.user.lastName')?.extra?.absoluteOrder).toBe(1);
    expect(flext.fields.find(f => f.name === 'data.user.middleName')?.extra?.absoluteOrder).toBe(3);
  });

  it('ignores helper nodes while building the data model tree', () => {
    const template = `
      {{!-- @use "put" --}}
      {{!-- @field "data.stats.total" type="number" --}}
      {{!-- @field "data.stats.done" type="number" --}}
      {{ put data.stats.total "--" }}
      {{ math data.stats.total "minus" data.stats.done }}
    `;

    const flext = new Flext(template);
    const [ dataNode ] = flext.model;
    const [ statsNode ] = dataNode.$;

    expect(dataNode.name).toBe('data');
    expect(statsNode.name).toBe('stats');
    expect(statsNode.$.map(node => node.name)).toEqual([ 'total', 'done' ]);
  });

  it('throws PotentialLoopError when requested model depth is exhausted', () => {
    const template = `
      {{ data.company.address.city }}
    `;

    const flext = new Flext(template);
    expect(() => flext.getDataModel(1)).toThrow(PotentialLoopError);
  });
});
