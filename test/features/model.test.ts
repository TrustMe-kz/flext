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
        hint: null,
        descr: null,
        value: null,
        isRequired: false,
      },
      {
        type: 'string',
        name: 'data.company.name',
        label: 'Название компании',
        hint: null,
        descr: null,
        value: null,
        isRequired: true,
      },
      {
        type: 'string',
        name: 'data.contract.type',
        label: 'Тип договора',
        hint: null,
        descr: null,
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
        type: 'string',
        name: 'data',
        label: null,
        hint: null,
        options: null,
        isRequired: false,
        $: [
          {
            type: 'object',
            name: 'company',
            label: 'Компания',
            hint: null,
            options: null,
            isRequired: false,
            $: [
              {
                type: 'string',
                name: 'name',
                label: 'Название компании',
                hint: null,
                options: null,
                isRequired: true,
                $: [],
              },
            ],
          },
          {
            type: 'string',
            name: 'contract',
            label: null,
            hint: null,
            options: null,
            isRequired: false,
            $: [
              {
                type: 'string',
                name: 'type',
                label: 'Тип договора',
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
