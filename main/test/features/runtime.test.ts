import { describe, it, expect } from 'vitest';
import Flext, {
  Processor,
  SimpleProcessor,
  TemplateDataError,
  TemplateDataValidationError,
  core,
} from '@flext';

describe('Flext runtime APIs', () => {
  it('SimpleProcessor respects preprocess and parse handlers', () => {
    let parsedTemplate = '';

    const processor = new SimpleProcessor();

    processor
      .setPreprocessHandler(template => `<section>${template}</section>`)
      .setParseHandler(template => {
        parsedTemplate = template;
        return core.lib.hbsToAst(template);
      })
      .setTemplate('<p>{{ data.value }}</p>')
      .setData({ data: { value: 'Ready' } });

    expect(parsedTemplate).toBe('<section><p>{{ data.value }}</p></section>');
    expect(processor.html.trim()).toBe('<section><p>Ready</p></section>');
  });

  it('Processor supports custom dialect, macro handler, title handler, and template assets', async () => {
    const originalTemplate = '<h1>Ignored</h1><p>{{ put [[name]] "--" }}</p>';

    const processor = new Processor();

    processor
      .setDialect({
        name: 'custom',
        aliases: [ 'custom' ],
        testAst: () => true,
        test: () => true,
        templateToStandard: template => template.replace('[[name]]', 'data.name'),
      })
      .setTitleHandler(() => [ 'Injected Title' ])
      .setMacroHandler(() => [
        { name: 'lang', params: [ { name: 'ru-RU', value: 'ru-RU' } ] },
        { name: 'use', params: [ { name: 'put', value: 'put' } ] },
      ])
      .setTemplate(originalTemplate)
      .setData({ data: { name: 'Anna' } });

    expect(processor.lang).toBe('ru-RU');
    expect(processor.title).toBe('Injected Title');
    expect(typeof processor.helpers.put).toBe('function');
    expect(processor.html.trim()).toContain('Anna');
    expect(await processor.assets.__template.text()).toBe(originalTemplate);
  });

  it('exposes validation errors through both validationErrors and errors getters', () => {
    const processor = new Flext(`
      {{!-- @field "data.user.name" required --}}
      {{ data.user.name }}
    `);

    expect(processor.isValid).toBe(false);
    expect(processor.validationErrors).toHaveLength(1);
    expect(processor.errors).toHaveLength(1);
    expect(processor.validationErrors[0]).toBeInstanceOf(TemplateDataValidationError);
    expect(processor.errors[0]).toBeInstanceOf(TemplateDataValidationError);
  });

  it('exports TemplateDataError publicly for module consumers', () => {
    const error = new TemplateDataError('Bad data');

    expect(error.name).toBe('TemplateDataError');
    expect(error.message).toBe('Bad data');
  });

  it('getCss renders utility classes for the processed template', async () => {
    const processor = new SimpleProcessor('<div class="text-red-500 font-bold">Hello</div>');
    const css = await processor.getCss();

    expect(css).toContain('.text-red-500');
    expect(css).toContain('.font-bold');
  });

  it('SimpleProcessor getHtml accepts runtime helper overrides', () => {
    const processor = new SimpleProcessor('<p>{{ greet name }}</p>').setData({ name: 'Anna' });
    const html = processor.getHtml(undefined, {
      greet: (value: string) => `Hello, ${value}!`,
    }).trim();

    expect(html).toBe('<p>Hello, Anna!</p>');
  });
});
