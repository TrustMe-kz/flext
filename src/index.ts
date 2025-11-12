import { AST } from '@handlebars/parser';
import { Obj, DataModelNode, Macro } from '@/types';
import { BaseError, PotentialLoopError } from '@/errors';
import { audit, getAst, getTemplate, getHtml, getCss, getDataModel, getMacros, getHtmlH1, ensureString, ensureTitle } from '@/lib';
import { inarr, has } from '@/lib';
import * as modules from './modules';


// Types

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'mixed';

export type FieldValue = string | number | boolean | Obj | FieldValue[] | null;

export type FieldOption = {
  name: string,
  fieldName: string,
  label?: string|null,
  descr?: string|null,
  value?: FieldValue | null,
  isDisabled: boolean,
};

export type Field = {
  type: FieldType,
  name: string,
  label?: string|null,
  descr?: string|null,
  hint?: string|null,
  value?: FieldValue,
  isRequired: boolean,
};

export type MetadataModelNode = DataModelNode & {
  type: FieldType,
  label?: string|null,
  descr?: string|null,
  hint?: string|null,
  options?: FieldValue[] | null,
  value?: string|null,
  isRequired: boolean,
};


// Constants

export const DEFAULT_HELPER_NAME = '__default';

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

  public async getCss(data: Obj = {}, options: Obj = {}): Promise<string> {
    const template = getTemplate(this.ast);
    const helpersObj = options?.helpers ?? {};
    const helpers = { ...this.helpers, ...helpersObj };


    // Doing some checks

    if (!template)
      throw new BaseError('Flext: Unable to get CSS: No template');


    return await getCss(
        template,
        { ...this.data, ...data },
        { ...options, helpers },
    );
  }

  public get html(): string {
    return this.getHtml();
  }
}

export class Flext extends SimpleFlext {
  declare public version: string;
  declare public lang: string;
  declare public title: string;
  declare public timeZone: string;
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

    const [ titleStr ] = getHtmlH1(this.ast);
    const macros = getMacros(this.ast);


    // Defining the functions

    const getAll = (_val: string): Macro[] | null => macros?.filter(m => m?.name === _val) ?? null;

    const get = (_val: string): string|null => {
      const [ macro ] = getAll(_val);
      const [ param ] = macro?.params ?? [];

      return param?.value ?? null;
    };

    const fieldToGroup = (_val: Field, type: FieldType = 'object'): Field => ({ ..._val, type });


    // Getting the data

    const version = get('v');
    const lang = get('lang');
    const title = get('title');
    const timeZone = get('timeZone');
    const modulesMacros = getAll('use');
    const lineHeight = get('lineHeight');
    const fieldGroupsMacros = getAll('group');
    const fieldMacros = getAll('field');
    // const optionMacros = getAll('option');


    // Getting the fields

    const fieldGroups = fieldGroupsMacros?.map(macroToField)?.map(g => fieldToGroup(g)) ?? [];

    const fields = fieldMacros?.map(macroToField) ?? [];


    // Setting the data

    if (version)
      this.setVersion(version);

    if (lang)
      this.setLang(lang);

    if (title || titleStr)
      this.setTitle(title ?? ensureTitle(titleStr));

    if (timeZone)
      this.setTimeZone(timeZone);

    if (lineHeight)
      this.setLineHeight(Number(lineHeight));

    if (fieldGroups?.length || fields?.length)
      this.setFields([ ...fieldGroups, ...fields ]);


    // Using the modules

    const moduleNames = modulesMacros.map(macroToModuleNames).flat();

    this.useModule(...moduleNames);


    return this;
  }

  public setVersion(val: string): this {
    this.version = val;
    return this;
  }

  public setLang(val: string): this {
    this.lang = val;
    return this;
  }

  public setTitle(val: string): this {
    this.title = val;
    return this;
  }

  public setTimeZone(val: string): this {
    this.timeZone = val;
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

      const isDefault = helperName === DEFAULT_HELPER_NAME;


      // Adding the helper

      const flext = this;

      const helper = function (...args1: any[]): any {
        const args = args1?.slice(0, -1) ?? [];
        const options = args1[args1.length - 1] ?? {};
        const namedArgs = options?.hash ?? {};
        // @ts-ignore
        const self = this;
        const getContent = () => options?.fn(self) ?? null;

        return handle({ flext, args, options, namedArgs, self, getContent });
      }

      if (isDefault)
        this.addHelper(name, helper);
      else
        this.addHelper(name + ':' + helperName, helper);
    }


    return this;
  }

  public getDataModel(depth: number = DEFAULT_MODEL_DEPTH): MetadataModelNode[] {

    // Defining the functions

    const getMetadataModelNode = (node: DataModelNode, options: Obj = {}, _depth: number = DEFAULT_MODEL_DEPTH): MetadataModelNode => {

      // Doing some checks

      if (_depth <= 0)
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
        }, _depth - 1));
      }


      return { name, label, type, isRequired, $ };
    }

    const isHelper = (node: DataModelNode): boolean => {
      for (const helperName in this.helpers) {
        if (!has(this.helpers, helperName)) continue;

        if (node?.name === helperName)
          return true;
      }

      return false;
    }


    // Getting the nodes

    const model = getDataModel(this.ast);

    const nodes: DataModelNode[] = model?.$ ?? [];


    return nodes
        .filter(n => !isHelper(n))
        .map(n => getMetadataModelNode(n, { fieldName: n?.name ?? null }, depth));
  }

  public getIsValid(data: Obj = {}, depth: number = DEFAULT_MODEL_DEPTH): boolean {

    // Defining the functions

    const isDataValidByModel = (_data: Obj, model: MetadataModelNode[], _depth: number = DEFAULT_MODEL_DEPTH): boolean => {

      // Doing some checks

      if (_depth <= 0)
        throw new PotentialLoopError('Flext: Unable to verify the data: The data model is too deep');


      // Iterating for each subnode

      for (const node of model) {

        // Getting the data

        const newData: Obj = _data[node.name] ?? null;


        // If the data was not found, but the field is required

        if (inarr(newData, '', null, undefined) && node?.isRequired)
          return false;

        if (!isDataValidByModel(newData ?? {}, node.$ as MetadataModelNode[], _depth - 1))
          return false;
      }


      return true;
    }


    return isDataValidByModel({ ...this.data, ...data }, this.model, depth);
  }

  public get model(): MetadataModelNode[] {
    return this.getDataModel();
  }

  public get isValid(): boolean {
    return this.getIsValid();
  }
}


// Functions

export function ensureFieldValue(val: any): FieldValue {

  // If the value is a string

  if (typeof val !== 'string') try {
    return JSON.parse(val);
  } catch (e) {
    return val ?? null;
  }


  // If the value is other

  else return val ?? null;
}

export function macroToModuleNames(val: Macro): string[] {
  const params = val?.params ?? [];
  return params.map(p => p?.value ?? null);
}

export function macroToField(val: Macro): Field {
  const params = val?.params ?? [];
  const [ nameParam, ...args ] = params;


  // Defining the functions

  const get = (_val: string): any => {
    const arg = args?.find(a => a?.name === _val) ?? null;

    if (arg && arg?.value)
      return arg?.value ?? null;
    else if (arg && arg?.name)
      return true;
    else
      return null;
  }


  // Getting the data

  const type = get('type') ?? DEFAULT_FIELD_TYPE;
  const name = nameParam?.value ?? null;
  const label = ensureString(get('label'));
  const descr = ensureString(get('descr'));
  const hint = ensureString(get('hint'));
  const value = ensureFieldValue(get('value'));
  const isRequired = !!get('required');


  // Doing some checks

  if (!name)
    throw new BaseError(`Unable to get field: The 'name' param is not set: ` + audit(name));


  return {
    type,
    name,
    label,
    descr,
    hint,
    value,
    isRequired,
  };
}

export function macroToFieldOption(val: Macro): FieldOption {
  const params = val?.params ?? [];
  const [ nameParam, ...args ] = params;


  // Defining the functions

  const get = (_val: string): any => {
    const arg = args?.find(a => a?.name === _val) ?? null;

    if (arg && arg?.value)
      return arg?.value ?? null;
    else if (arg && arg?.name)
      return true;
    else
      return null;
  }


  // Getting the data

  const name = nameParam?.value ?? null;
  const fieldName = ensureString(get('for'));
  const label = ensureString(get('label'));
  const descr = ensureString(get('descr'));
  const value = ensureFieldValue(get('value'));
  const isDisabled = !!get('disabled');


  // Doing some checks

  if (!name)
    throw new BaseError(`Unable to get field option: The 'name' param is not set: ` + audit(name));

  if (!fieldName)
    throw new BaseError(`Unable to get field option '${name}': The 'for' param is not set: ` + audit(name));


  return {
    name,
    fieldName,
    label,
    descr,
    value,
    isDisabled,
  };
}


export default Flext;
