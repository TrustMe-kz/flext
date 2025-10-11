import { readFileSync } from 'fs';
import { join } from 'path';
import Flext from '@flext';


// Types

export type GetHtmlOptions = {
  modules: string | string[],
  expression: string,
  data?: Record<string, any>,
  helpers?: Record<string, any>,
};


// Variables

export const templatePath = join(process.cwd(), 'test-template.hbs');

export const templateSyntax = readFileSync(templatePath, 'utf-8');


// Functions

export function getHtml(options: GetHtmlOptions): string {

  // Getting the data

  const { modules, expression, data = {}, helpers = {} } = options;
  const newModules = Array.isArray(modules) ? modules : [ modules ];
  const newNewModules = newModules?.map(name => `"${name}"`)?.join(' ') || '""';


  // Getting the Flext

  const newTemplateSyntax = templateSyntax
    .replace('{MODULES}', newNewModules)
    .replace('{CONTENT}', expression);

  const flext = new Flext(newTemplateSyntax);


  return flext.getHtml(data, helpers);
}
