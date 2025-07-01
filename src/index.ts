import { Obj } from '@/types';
import { TemplateDelegate } from 'handlebars';
import { BaseError } from '@/errors';
import { strToTemplate, getHtml } from '@/lib';
import { has } from '@/lib';
// @ts-ignore
import * as modules from './modules/*/*.ts';


// Types

export type Macro = {
  name: string,
  value: string,
};


// Constants

export const DEFAULT_MODULE_SCRIPT = 'index';

export const MODULES_DIR = './modules';


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
  declare public onReadyVal: any;
  public isReady: boolean = false;

  constructor(val: string|null = null, options: any = {}) {
    super();


    // Getting the options

    const onReady = options?.onReady ?? (() => {});


    // Setting the data

    this.setOnReady(onReady);
    if (val) this.setHbs(val ?? '');
  }

  public async useModule(...val: string[]): Promise<void> {
    for (const moduleName of val) {

      // Getting the module

      const module = await getModule(moduleName);
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

    if (moduleNames)
      this.useModule(...moduleNames).then(this.onReady.bind(this)).catch(console.error);
    else
      this.onReady();


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

  public setOnReady(val: any): this {
    this.onReadyVal = val;
    return this;
  }

  public getHtml(data: Obj = {}, helpers: Obj = {}): string {
    if (this.isReady)
      return super.getHtml(data, helpers);
    else
      throw new BaseError('Flext: Unable to get the HTML: The template is not ready');
  }

  private onReady(): void {
    this.isReady = true;
    this.onReadyVal(this.html);
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

export async function getModule(name: string, script: string = DEFAULT_MODULE_SCRIPT): Promise<any> {
  const path = `${MODULES_DIR}/${name}/${script}`;
  const pathTs = path + '.ts';
  const pathIndex = path + '/index.ts';


  // Getting the loader

  const get = modules[pathTs] ?? modules[pathIndex] ?? null;

  if (!get)
    throw new BaseError(`Flext: Module '${name}' does not exist`);


  // Getting the module

  const module: any = await get();


  // Getting the module

  const result: any = module?.default ?? null;

  if (!result)
    throw new BaseError(`Flext: Unable to get module '${name}': The ES module has no default export`);


  return result;
}


// Helpers

export class RegexHelper {
  public static macro = /{{!-- @(?<name>.+) "(?<value>.+)" --}}/gm;
}


export default Flext;
