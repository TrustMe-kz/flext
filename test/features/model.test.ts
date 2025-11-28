import { describe, it, expect } from 'vitest';
import Flext from '@flext';

describe('Flext data model and field options', () => {
  it('merges @group, @field and @option metadata into the model tree', () => {
    const template = `
      {{!-- @use "put" --}}
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
        descr: null,
        hint: null,
        value: null,
        isRequired: false,
      },
      {
        type: 'string',
        name: 'data.company.name',
        label: 'Название компании',
        descr: null,
        hint: null,
        value: null,
        isRequired: true,
      },
      {
        type: 'string',
        name: 'data.contract.type',
        label: 'Тип договора',
        descr: null,
        hint: null,
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
      },
    ]);

    expect(model).toEqual([
      {
        name: 'data',
        label: null,
        type: 'string',
        options: null,
        isRequired: false,
        $: [
          {
            name: 'company',
            label: 'Компания',
            type: 'object',
            options: null,
            isRequired: false,
            $: [
              {
                name: 'name',
                label: 'Название компании',
                type: 'string',
                options: null,
                isRequired: true,
                $: [],
              },
            ],
          },
          {
            name: 'contract',
            label: null,
            type: 'string',
            options: null,
            isRequired: false,
            $: [
              {
                name: 'type',
                label: 'Тип договора',
                type: 'string',
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
                $: [],
              },
            ],
          },
        ],
      },
    ]);
  });
});
