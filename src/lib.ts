import { DateTime } from 'luxon';
import { AST } from '@handlebars/parser';
import { createGenerator, presetTypography, Preset } from 'unocss';
import { presetWind4, Theme as Wind4Theme } from '@unocss/preset-wind4';
import { Obj, Macro, MacroParam, DataModelNode, DataModel } from '@/types';
import { BaseError, PotentialLoopError, BaseWarning } from '@/errors';
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
  public CommentStatement(node) {
    this.onCollect(node.value);
    return super.CommentStatement(node);
  }
}

class HandlebarsContentCollector extends HandlebarsCollector<string> {
  public ContentStatement(node) {
    this.onCollect(node.value);
    return super.ContentStatement(node);
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

class FlextHtmlH1Collector extends HandlebarsContentCollector {
  public match = FilterHelper.htmlH1Somewhere;
}


// Checking Functions

export function isNumber(val: any): boolean {
  return !isNaN(Number(val));
}

export function isObject(val: any): boolean {
  return typeof val === 'object' && val !== null;
}

export function has(obj: Obj, key: string): boolean {
  return obj.hasOwnProperty(key);
}

export function inarr(val: any, ...arr: any): boolean {
  return arr.includes(val);
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
  const macroArr = new FlextMacroCollector().collect(ast);
  const result: Macro[] = [];


  // Iterating for each macro string

  for (const macroStr of macroArr) {
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

export function getContent(ast: AST.Program): string[] {
  return new HandlebarsContentCollector().collect(ast);
}

export function getHtmlH1(ast: AST.Program, doWarn: boolean = true): string[] {
  const titleArr = new FlextHtmlH1Collector().collect(ast);
  const result: string[] = [];


  // Iterating for each macro string

  for (const titleStr of titleArr) {
    const matches = titleStr?.trim()?.match(RegexHelper.htmlH1Somewhere) ?? null;


    // Doing some checks

    if (!matches && doWarn)
      throw new BaseWarning('Flext: Unable to parse the H1: Bad HTML: ' + audit(titleStr));


    // Getting the data

    const val = matches?.groups?.value ?? null;

    if (!val && doWarn)
      throw new BaseWarning('Flext: Unable to parse the H1: Bad HTML: ' + audit(titleStr));


    result.push(val);
  }


  return result;
}

export function getHtmlH1Title(ast: AST.Program, doWarn: boolean = true): string|null {
  const [ result ] = getHtmlH1(ast, doWarn);
  return result ?? null;
}


// Framework Functions

export function ensureDate(val: Date | string | number): Date {
  const isDateObj = isObject(val) && val instanceof Date;
  const isDbDate = typeof val === 'string' && RegexHelper.dbDateStr.test(val);


  // Defining the functions

  const unixDate = (val1: string|number): Date => {
    const date = new Date(val1);

    if (isNaN(date.getTime()))
      throw new BaseWarning('Flext: Unable to get date: The date is invalid: ' + audit(val1));
    else
      return date;
  }

  const dbDate = (val1: string): Date => {
    const [ year, month, day ] = val1?.split('-')?.map(Number) ?? [];

    if (year && month && day)
      return DateTime.fromObject({ year, month, day }).toJSDate();
    else
      throw new BaseError('Unable to get date: The date is invalid: ' + audit(val1));
  }

  const isoDate = (val1: string): Date => {
    const date = DateTime.fromISO(val1);

    if (date.isValid)
      return date.toJSDate();
    else
      throw new BaseWarning('Flext: Unable to get date: The date is invalid: ' + audit(val1));
  }


  if (isDateObj)
    return val as Date;

  if (isNumber(val))
    return unixDate(val as number);

  else if (isDbDate)
    return dbDate(val as string);

  else
    return isoDate(val as string);
}

export function ensureTitle(val: string|number): string {
  let result: string|null = String(val).trim();


  // Defining the functions

  const filter1 = (search: string | RegExp, val: string = '') => result = result.trim().replace(search, val);


  // Getting the title

  filter1('\n', ' ');
  filter1(/\s{2,}/mg, ' ');
  filter1(/[^\p{L}\d\s]/mgu);


  return result;
}

export function filter(regex: RegExp, val: string|number): boolean {
  return !!String(val).trim().match(regex);
}


// Helpers

export class RegexHelper {
  public static dbDateStr = /^\d+-\d+-\d+$/;
  public static macro = /^@(?<name>.+?) (?<params>.+)$/;
  public static macroParams = /(?<param>".+?")|(?<namedParam>[a-zA-Z0-9]+=".+?")|(?<simplaeParam>[a-zA-Z0-9]+)/gm;
  public static macroParam = /^"(?<value>.+)"$/;
  public static macroNamedParam = /^(?<name>.+)="(?<value>.+)"$/;
  public static macroSimpleParam = /^(?<name>[a-zA-Z]+)$/;
  public static htmlH1Somewhere = /\<h1.*\>(?<value>.*)\<\/h1.*\>/mg;
}

export class FilterHelper {
  public static macro(val: string): boolean {
    return filter(RegexHelper.macro, val);
  }

  public static htmlH1Somewhere(val: string): boolean {
    return filter(RegexHelper.htmlH1Somewhere, val);
  }
}
