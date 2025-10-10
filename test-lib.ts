import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Flext from '../../src';


// Types

type RenderOptions = {
  modules: string | string[],
  expression: string,
  data?: Record<string, any>,
  helpers?: Record<string, any>,
};


// Constants

const TEMPLATE_PATH = join(process.cwd(), 'test-template.hbs');
const TEMPLATE_SOURCE = readFileSync(TEMPLATE_PATH, 'utf-8');


// Functions

export function renderTemplate(options: RenderOptions): string {
  const { modules, expression, data = {}, helpers = {} } = options;
  const moduleList = Array.isArray(modules) ? modules : [ modules ];
  const modulesMacro = moduleList.map(name => `"${name}"`).join(' ') || '""';

  const templateSource = TEMPLATE_SOURCE
    .replace('__MODULES__', modulesMacro)
    .replace('__CONTENT__', expression);

  const flext = new Flext(templateSource);

  return flext.getHtml(data, helpers);
}
