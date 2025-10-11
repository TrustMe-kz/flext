import { readFileSync } from 'fs';
import { join } from 'path';
import { Obj } from '@/types';
import Flext from '@flext';


// Types

export type GetHtmlOptions = {
  modules: string | string[],
  template: string,
  data?: Obj,
  helpers?: Obj,
};


// Constants

export const DEFAULT_COLOR = 'text-blue-500';


// Variables

export const templatePath = join(process.cwd(), 'test-template.hbs');

export const templateSyntax = readFileSync(templatePath, 'utf-8');


// Functions

export function getHtml(options: GetHtmlOptions): string {

  // Getting the data

  const { modules, template, data = {}, helpers = {} } = options;
  const newModules = Array.isArray(modules) ? modules : [ modules ];
  const newNewModules = newModules?.map(name => `"${name}"`)?.join(' ') || '""';


  // Getting the Flext

  const newTemplateSyntax = templateSyntax
    .replace('{MODULES}', newNewModules)
    .replace('{CONTENT}', template);

  const flext = new Flext(newTemplateSyntax);


  return flext.getHtml(data, helpers);
}

export function mockPut(val: string, color: string = DEFAULT_COLOR): string {
  return `<span class="${color}">${val}</span>`;
}
