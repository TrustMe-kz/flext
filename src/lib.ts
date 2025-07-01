import { Obj } from '@/types';
import Handlebars, { TemplateDelegate } from 'handlebars';


// Functions

export function has(obj: Obj, key: string): boolean {
  return obj.hasOwnProperty(key);
}

export function strToTemplate(val: string): TemplateDelegate {
  return Handlebars.compile(val);
}

export function getHtml(template: TemplateDelegate, data: Obj = {}, helpers: Obj = {}): string {
  return template(data, { helpers });
}

export function defineModule(options: any = {}): any {
  const helpers = options?.helpers ?? null;
  return { helpers };
}
