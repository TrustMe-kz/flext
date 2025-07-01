import { Obj } from '@/types';
import { TemplateDelegate } from 'handlebars';
import { BaseError } from '@/errors';
import { strToTemplate, getHtml } from '@/lib';
import { has } from '@/lib';
import * as modules from './modules';


// Types

export type Macro = {
  name: string,
  value: string,
};


// Constants

export const DEFAULT_MODULE_SCRIPT = 'index';


// Classes

export class SimpleFlext  {
  declare public template: TemplateDelegate;
  declare public data: Obj;
  declare public helpers: Obj;

  constructor(val: string|null = null, data: Obj = {}, helpers: Obj = {}) {
    this.setData(data);
    this.setHelpers(helpers);
    if (val) this.setHbs(val);
  }

  public setHbs(val: string): this {
    this.data = {};
    this.helpers = {};
    this.template = strToTemplate(val);

    return this;
  }

  public setData(val: Obj): this {
    this.data = val;
    return this;
  }

  public setHelpers(val: Obj): this {
    this.helpers = val;
    return this;
  }

  public addHelper(name: string, val: any): this {
    this.helpers[name] = val;
    return this;
  }

  public getHtml(data: Obj = {}, helpers: Obj = {}): string {
    if (this.template)
      return getHtml(this.template, data, helpers);
    else
      throw new BaseError('Flext: Unable to get the HTML: No template');
  }

  public get html(): string {
    return this.getHtml(this.data, this.helpers);
  }
}

export class Flext extends SimpleFlext {
  declare public version: string;
  declare public lineHeight: number;

  public useModule(...val: string[]): this {
    for (const moduleName of val) {

      // Getting the module

      const module = modules[moduleName];
      const moduleHelpers = module?.helpers ?? {};


      // Setting the helpers

      for (const helperName in moduleHelpers) {
        if (!has(moduleHelpers, helperName)) continue;


        // Getting the data

        const handle = moduleHelpers[helperName];
        const isDefault = helperName === 'default';


        // Getting the helper

        const helper = (...args: any[]) => handle({ args });


        if (isDefault)
          this.addHelper(moduleName, helper);
        else
          this.addHelper(moduleName + ':' + helperName, helper);
      }
    }


    return this;
  }

  public setHbs(val: string): this {
    const macros = getMacros(val);


    // Defining the functions

    const get = (val: string): string|null => {
      const macro = macros?.find(m => m?.name === val);
      return macro?.value ?? null;
    };


    // Getting the data

    const version = get('v');
    const modulesStr = get('use');
    const lineHeight = get('lineHeight');


    // Setting the data

    if (version) this.setVersion(version);
    if (lineHeight) this.setLineHeight(Number(lineHeight));


    // Setting the template

    super.setHbs(val);


    // Using the modules

    const moduleNames = modulesStr?.split(',') ?? null;

    this.useModule(...moduleNames);


    return this;
  }

  public setVersion(val: string): this {
    this.version = val;
    return this;
  }

  public setLineHeight(val: number): this {
    this.lineHeight = val;
    return this;
  }
}


// Functions

export function getMacros(hbs: string): Macro[] {
  const matches = hbs.matchAll(RegexHelper.macro);
  const result: Macro[] = [];


  // Iterating for all matches

  for (const match of matches) {
    const name = match?.groups?.name ?? null;
    const value = match?.groups?.value ?? null;


    // Doing some checks

    if (!name || !value)
      throw new BaseError(`Flext: Unable to get macros: Bad macro: '${match}'`);


    result.push({ name, value });
  }


  return result;
}


// Helpers

export class RegexHelper {
  public static macro = /{{!-- @(?<name>.+) "(?<value>.+)" --}}/gm;
}


export default Flext;
