import { AST } from '@handlebars/parser';
import { Obj, DataModelNode, Macro } from '@/types';
import { BaseError, PotentialLoopError } from '@/errors';
import { getAst, getTemplate, getHtml, getCss, getDataModel, getMacros } from '@/lib';
import { has } from '@/lib';
import * as modules from './modules';


// Types

export type FieldType = 'string' | 'number' | 'boolean' | 'date';

export type Field = {
  name: string,
  label?: string|null,
  type: FieldType,
  isRequired: boolean,
};

export type MetadataModelNode = DataModelNode & {
  label?: string|null,
  type: FieldType,
  isRequired: boolean,
};


// Constants

export const DEFAULT_FIELD_TYPE: FieldType = 'string';

export const DEFAULT_MODEL_DEPTH = 10;


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


    // Doing some checks

    if (!template)
      throw new BaseError('Flext: Unable to get HTML: No template');


    return getHtml(
        template,
        { ...this.data, ...data },
        { ...this.helpers, ...helpers },
    );
  }

  public async getCss(data: Obj = {}, helpers: Obj = {}): Promise<string> {
    const template = getTemplate(this.ast);


    // Doing some checks

    if (!template)
      throw new BaseError('Flext: Unable to get CSS: No template');


    return await getCss(
        template,
        { ...this.data, ...data },
        { ...this.helpers, ...helpers },
    );
  }

  public get html(): string {
    return this.getHtml();
  }
}

export class Flext extends SimpleFlext {
  declare public version: string;
  declare public lineHeight: number;
  declare public fields: Field[];

  public useModule(...val: string[]): this {
    for (const name of val)
      this.addModule(name, modules[name]);

    return this;
  }

  public setTemplate(val: string): this {

    // Setting the template

    super.setTemplate(val);


    // Defining the variables

    const macros = getMacros(this.ast);


    // Defining the functions

    const getAll = (val: string): Macro[] | null => macros?.filter(m => m?.name === val) ?? null;

    const get = (val: string): string|null => {
      const [ macro ] = getAll(val);
      const [ param ] = macro?.params ?? null;

      return param?.value ?? null;
    };


    // Getting the data

    const version = get('v');
    const modulesStr = get('use');
    const lineHeight = get('lineHeight');
    const fieldMacros = getAll('field');


    // Setting the data

    const fields = fieldMacros?.map(macroToField) ?? null;

    if (version)
      this.setVersion(version);

    if (lineHeight)
      this.setLineHeight(Number(lineHeight));

    if (fields)
      this.setFields(fields);


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

  public setFields(val: Field[]): this {
    this.fields = val;
    return this;
  }

  public addModule(name: string, val: any): this {
    const helpers = val?.helpers ?? {};


    // Iterating for each helper

    for (const helperName in helpers) {
      if (!has(helpers, helperName)) continue;


      // Getting the data

      const handle = helpers[helperName];
      const isDefault = helperName === 'default';


      // Adding the helper

      const helper = (...args: any[]) => handle({ args });

      if (isDefault)
        this.addHelper(name, helper);
      else
        this.addHelper(name + ':' + helperName, helper);
    }


    return this;
  }

  public getDataModel(depth: number = DEFAULT_MODEL_DEPTH): MetadataModelNode[] {

    // Defining the functions

    const isHelper = (node: DataModelNode): boolean => {
      for (const helperName in this.helpers) {
        if (!has(this.helpers, helperName)) continue;

        if (node?.name === helperName)
          return true;
      }

      return false;
    }

    const getMetadataModelNode = (node: DataModelNode, options: Obj = {}, depth: number = DEFAULT_MODEL_DEPTH): MetadataModelNode => {

      // Doing some checks

      if (depth <= 0)
        throw new PotentialLoopError('Flext: Unable to get data model: The data model is too deep');


      // Getting the metadata

      const fieldName = options?.fieldName ?? null;
      const field = this.fields?.find(f => f?.name === fieldName) ?? null;


      // Getting the data

      const name = node?.name ?? null;
      const label = field?.label ?? null;
      const type = field?.type ?? DEFAULT_FIELD_TYPE;
      const isRequired = !!field?.isRequired;
      const nodes = node?.$ ?? [];


      // Getting the sub-nodes

      const $: MetadataModelNode[] = [];

      for (const node of nodes) {
        const nodeName = node?.name ?? null;

        $.push(getMetadataModelNode(node, {
          fieldName: fieldName + '.' + nodeName,
        }, depth - 1));
      }


      return { name, label, type, isRequired, $ };
    }


    // Getting the nodes

    const model = getDataModel(this.ast);
    const nodes: DataModelNode[] = model?.$ ?? [];


    return nodes
        .filter(n => !isHelper(n))
        .map(n => getMetadataModelNode(n, { fieldName: n?.name ?? null }, depth));
  }

  public get model(): Obj {
    return this.getDataModel();
  }
}


// Functions

export function macroToField(val: Macro): Field {
  const params = val?.params ?? [];
  const [ nameParam, ...args ] = params;


  // Defining the functions

  const get = (val: string): any => {
    const arg = args?.find(a => a?.name === val) ?? null;

    if (arg && arg?.value)
      return arg?.value ?? null;
    else if (arg && arg?.name)
      return true;
    else
      return null;
  }


  // Getting the data

  const name = nameParam?.value ?? null;
  const label = get('label');
  const type = get('type') ?? DEFAULT_FIELD_TYPE;
  const isRequired = !!get('required');


  return { name, label, type, isRequired };
}


export default Flext;
