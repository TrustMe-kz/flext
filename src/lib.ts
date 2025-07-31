import { AST } from '@handlebars/parser';
import { createGenerator, presetTypography, Preset } from 'unocss';
import { presetWind4, Theme as Wind4Theme } from '@unocss/preset-wind4';
import { Obj, Macro, MacroParam, DataModelNode, DataModel } from '@/types';
import { PotentialLoopError, BaseWarning } from '@/errors';
import Handlebars, { TemplateDelegate } from 'handlebars';


// Third-parties

export const uno = createGenerator({
  presets: [
    presetWind4(),
    presetTypography() as unknown as Preset<Wind4Theme>,
  ],
  theme: {},
});


// Types

export type CollectorFilterHandler<T = any> = (val?: T) => boolean;


// Constants

export const DEFAULT_MODEL_DEPTH = 10;


// Classes

export class HandlebarsCollector<T = any> extends Handlebars.Visitor {
  public data: T[] = [];
  public match: CollectorFilterHandler<T> = () => true;

  constructor(filter?: CollectorFilterHandler<T>) {
    super();
    if (filter) this.setMatchHandler(filter);
  }

  public onCollect(val: T): void {
    if (this.match(val))
      this.data.push(val);
  }

  public setMatchHandler(val: CollectorFilterHandler<T>): this {
    this.match = val;
    return this;
  }

  public setAst(ast: AST.Program): this {
    this.accept(ast);
    return this;
  }

  public collect(ast: AST.Program): T[] {
    this.data = [];

    this.setAst(ast);

    return this.data;
  }
}

class HandlebarsCommentCollector extends HandlebarsCollector<string> {
  CommentStatement(node) {
    this.onCollect(node.value);
    return super.CommentStatement(node);
  }
}

class HandlebarsPathCollector extends HandlebarsCollector<string> {
  PathExpression(node) {
    this.onCollect(node.original);
    return super.PathExpression(node);
  }
}

class FlextMacroCollector extends HandlebarsCommentCollector {
  public match = FilterHelper.macro;
}


// Checking Functions

export function isObject(val: any): boolean {
  return typeof val === 'object' && val !== null;
}

export function has(obj: Obj, key: string): boolean {
  return obj.hasOwnProperty(key);
}


// System Functions

export function audit(val: any): string {
  switch (typeof val) {
    case 'string':
      return `'${val}'`;
    case 'object':
      return JSON.stringify(val);
    default:
      return String(val);
  }
}

export function defineModule(options: any = {}): any {
  const helpers = options?.helpers ?? null;
  return { helpers };
}


// Transform Functions

export function unique<T = any>(arr: T[]): T[] {
  return [ ...new Set(arr) ];
}


// Handlebars Functions

export function getAst(val: string): AST.Program {
  return Handlebars.parse(val);
}

export function getTemplate(val: string | AST.Program): TemplateDelegate {
  return Handlebars.compile(val);
}

export function getHtml(template: TemplateDelegate, data: Obj = {}, helpers: Obj = {}): string {
  return template(data, { helpers });
}

export async function getCss(template: TemplateDelegate, data: Obj = {}, helpers: Obj = {}): Promise<string> {
  const generator = await uno;
  const html = getHtml(template, data, helpers);
  const { css } = await generator.generate(html, { preflights: true });

  return css;
}


// Analyze Functions

export function getPaths(ast: AST.Program): string[] {
  const paths = new HandlebarsPathCollector().collect(ast);
  return unique(paths);
}

export function pathToDataModelNode(path: string, depth: number = DEFAULT_MODEL_DEPTH): DataModelNode {

  // Doing some checks

  if (depth <= 0)
    throw new PotentialLoopError('Flext: Unable to get the model: The model is too deep');


  // Getting the node

  const [ name, ...items ] = path?.split('.') ?? [];
  const result: DataModelNode = { name };

  if (items?.length > 0)
    result.$ = [ pathToDataModelNode(items?.join('.'), depth - 1) ];


  // Getting the root mode


  return result;
}

export function pathToDataModel(path: string, depth: number = DEFAULT_MODEL_DEPTH): DataModel {
  const node: any = pathToDataModelNode(path, depth);
  const dataModel: any = { name: 'root', $: [ node ] };


  // Defining the methods

  dataModel.addPath = (_path: string, _depth: number = DEFAULT_MODEL_DEPTH): void => {
    const newNode = pathToDataModelNode(_path, _depth);
    let cursorRef: DataModelNode = dataModel;
    let cursor: DataModelNode | null = newNode;


    // Iterating for each new node

    for (let i = 0; i < 99; i++) {

      // Doing some checks

      if (!cursor) return;


      // Trying to match the model node

      const nodesRef = cursorRef?.$ ?? [];
      let nextCursorRef = null;

      for (const nodeRef of nodesRef)
        if (cursor?.name === nodeRef?.name)
          nextCursorRef = nodeRef;


      // If the model node does not exist

      if (!nextCursorRef) {
        cursorRef.$ = [ ...nodesRef, cursor ];
        return;
      }


      // Setting the next cursor

      const [ nextCursor ] = cursor.$ ?? [];

      cursorRef = nextCursorRef;
      cursor = nextCursor ?? null;
    }
  };


  return dataModel;
}

export function getDataModel(ast: AST.Program): DataModel {
  const [ first, ...paths ] = getPaths(ast);
  const result: DataModel = pathToDataModel(first);


  // Iterating for each path

  for (const path of paths)
    result.addPath(path);


  return result;
}

export function getMacroParam(val: string): MacroParam | null {

  // Defining the functions

  const match = (regex: RegExp): any => val?.match(regex) ?? null;

  const get = (val: any): MacroParam => {
    const value = val?.groups?.value ?? null;
    const name = val?.groups?.name ?? value;

    return { name, value };
  }


  // Guessing the param type

  const param = match(RegexHelper.macroParam);
  const namedParam = match(RegexHelper.macroNamedParam);
  const simpleParam = match(RegexHelper.macroSimpleParam)


  // If the param type is known

  if (param)
    return get(param);

  if (namedParam)
    return get(namedParam);

  if (simpleParam)
    return get(simpleParam);


  return null;
}

export function getMacroParams(val: string, doWarn: boolean = true): MacroParam[] {
  const matches = val?.match(RegexHelper.macroParams) ?? [];
  const result: MacroParam[] = [];


  // Iterating for each token

  for (const token of matches) {
    const macro = getMacroParam(token);

    if (macro)
      result.push(macro);
    else if (doWarn)
      throw new BaseWarning('Flext: Unable to parse the macros: Bad token: ' + audit(token));
  }


  return result;
}

export function getMacros(ast: AST.Program, doWarn: boolean = true): Macro[] {
  const macrosStr = new FlextMacroCollector().collect(ast);
  const result: Macro[] = [];


  // Iterating for each macro string

  for (const macroStr of macrosStr) {
    const matches = macroStr?.trim()?.match(RegexHelper.macro) ?? null;


    // Doing some checks

    if (!matches && doWarn)
      throw new BaseWarning('Flext: Unable to parse the macros: Bad macro: ' + audit(macroStr));


    // Getting the data

    const name = matches?.groups?.name ?? null;
    const paramsStr = matches?.groups?.params ?? null;
    const params = getMacroParams(paramsStr, doWarn);


    result.push({ name, params });
  }


  return result;
}


// Helpers

export class RegexHelper {
  public static macro = /^@(?<name>.+?) (?<params>.+)$/;
  public static macroParams = /(?<param>".+?")|(?<namedParam>[a-zA-Z0-9]+=".+?")|(?<simplaeParam>[a-zA-Z0-9]+)/gm;
  public static macroParam = /^"(?<value>.+)"$/;
  public static macroNamedParam = /^(?<name>.+)="(?<value>.+)"$/;
  public static macroSimpleParam = /^(?<name>[a-zA-Z]+)$/;
}

export class FilterHelper {
  public static macro(val: string): boolean {
    return !!val?.trim()?.match(RegexHelper.macro);
  }
}
