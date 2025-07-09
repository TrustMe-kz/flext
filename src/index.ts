import { AST } from '@handlebars/parser';
import { Obj } from '@/types';
import { BaseError } from '@/errors';
import { getAst, getTemplate, getHtml, getDataModel, getMacros } from '@/lib';
import { has } from '@/lib';
import * as modules from './modules';


// Classes

export class SimpleFlext  {
  declare public ast: AST.Program;
  declare public data: Obj;
  declare public helpers: Obj;

  constructor(val: string|null = null, data: Obj = {}, helpers: Obj = {}) {
    this.setData(data);
    this.setHelpers(helpers);
    if (val) this.setTemplate(val);
  }

  public setTemplate(val: string): this {
    this.data = {};
    this.helpers = {};
    this.ast = getAst(val);

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
    const template = getTemplate(this.ast);

    if (template)
      return getHtml(template, data, helpers);
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

  public setTemplate(val: string): this {

    // Setting the template

    super.setTemplate(val);


    // Defining the variables

    const macros = getMacros(this.ast);
    console.log(macros, 'macros');


    // Defining the functions

    const get = (val: string): string|null => {
      const macro = macros?.find(m => m?.name === val);
      return macro?.params[0]?.value ?? null;
    };


    // Getting the data

    const version = get('v');
    const modulesStr = get('use');
    const lineHeight = get('lineHeight');


    // Setting the data

    if (version) this.setVersion(version);
    if (lineHeight) this.setLineHeight(Number(lineHeight));


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

  public getDataModel(): Obj {
    return getDataModel(this.ast);
  }

  public get model(): Obj {
    return this.getDataModel();
  }
}


export default Flext;
