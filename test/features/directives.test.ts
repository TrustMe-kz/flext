import { describe, it, expect } from 'vitest';
import Flext from '@flext';

describe('Flext features', () => {
  it('collects metadata from template directives', () => {
    const template = `
      {{!-- @v "1.19.beta1" --}}
      {{!-- @lang "ru-KZ" --}}
      {{!-- @title "Договор об обучении" --}}
      {{!-- @timeZone "Asia/Almaty" --}}
      {{!-- @lineHeight "1.6" --}}
      {{!-- @field "data.user.age" type="number" label="Возраст" required --}}
      {{!-- @field "data.user.name" label="Имя" --}}
      {{!-- @use "put" --}}
      <h1>Этот заголовок игнорируется</h1>
      <p>{{ put data.user.name "—" }}</p>
    `;

    const data = { data: { user: { name: 'Кайрат', age: 21 } } };
    const flext = new Flext().setTemplate(template).setData(data);

    expect(flext.version).toBe('1.19.beta1');
    expect(flext.lang).toBe('ru-KZ');
    expect(flext.title).toBe('Договор об обучении');
    expect(flext.timeZone).toBe('Asia/Almaty');
    expect(flext.lineHeight).toBe(1.6);
    expect(flext.fields).toEqual([
      {
        name: 'data.user.age',
        label: 'Возраст',
        type: 'number',
        isRequired: true,
      },
      {
        name: 'data.user.name',
        label: 'Имя',
        type: 'string',
        isRequired: false,
      },
    ]);
    expect(typeof flext.helpers.put).toBe('function');
    expect(flext.data).toStrictEqual(data);
  });

  it('derives title from the first <h1> when no @title directive is provided', () => {
    const template = `
      {{!-- @v "1.0.beta2" --}}
      <main>
        <h1>
          Flext Main Title 2024
        </h1>
        <section>
          <p>Secondary heading</p>
        </section>
      </main>
    `;

    const flext = new Flext().setTemplate(template);

    expect(flext.title).toBe('Flext Main Title 2024');
  });
});
