import { DateTime } from 'luxon';
import { AST } from '@handlebars/parser';
import { createGenerator, presetTypography, Preset } from 'unocss';
import { presetWind4, Theme as Wind4Theme } from '@unocss/preset-wind4';
import { Obj, Isset, IsNumber, IsObject, Has, Inarr, Macro, MacroParam, DataModel, DataModelNode, CollectorFilterHandler } from '@/types';
import { BaseError, BaseWarning, PotentialLoopError, TemplateDataValidationError } from '@/errors';
import striptags from 'striptags';
import Handlebars, { TemplateDelegate } from 'handlebars';
import * as types from "@/types";
import * as errors from "@/errors";
import {DEFAULT_FIELD_TYPE} from "@/index";


// Third-parties

export const uno = createGenerator({
    presets: [
        presetWind4(),
        presetTypography() as Preset<Wind4Theme>,
    ],
    preflights: [
        // kr: Costyl for TW
        { getCSS: () => `:host, :root {
  --un-bg-opacity: 100%;
  --un-text-opacity: 100%;
  --un-border-opacity: 100%;
  --un-outline-opacity: 100%;
  --un-ring-opacity: 100%;
  --un-divide-opacity: 100%;
  --un-placeholder-opacity: 100%;
}` },
    ],
    theme: {},
});


// Constants

export const DEFAULT_MODEL_DEPTH = 10;


// Variables

export const stripHtml = striptags;


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
    public PathExpression(node) {
        const path = node.original;


        // Defining the functions

        const test = (val: string): boolean => path === val;


        // TODO: kr: Costyl to skip '{{#if}}' paths in AST

        if (test('if') || test('unless') || test('each') || test('with'))
            return super.PathExpression(node);


        // Collecting the path

        this.onCollect(node.original);


        return super.PathExpression(node);
    }
}

class FlextMacroCollector extends HandlebarsCommentCollector {
    public match = FilterHelper.macro;
}

class FlextH1SomewhereContentCollector extends HandlebarsContentCollector {
    public match = FilterHelper.htmlH1Somewhere;
}


// Checking Functions

export function inarr<T extends any, A extends any[]>(val: T, ...arr: A): Inarr<T, A> {
    return arr.includes(val) as Inarr<T, A>;
}

export function has<T extends Obj, K extends keyof T>(obj: T, key: K): Has<T, K> {
    return obj.hasOwnProperty(key) as Has<T, K>;
}

export function isset<T extends any>(val: T): Isset<T> {
    return !inarr(val, null, undefined) as Isset<T>;
}

export function isNumber<T extends any>(val: T): IsNumber<T> {
    return (isset(val) && !isNaN(Number(val))) as IsNumber<T>;
}

export function isObject<T extends any>(val: T): IsObject<T> {
    return (typeof val === 'object' && val !== null) as IsObject<T>;
}


// System Functions

export function audit(val: any): string {
    if (isObject(val))
        return JSON.stringify(val);

    else if (typeof val === 'string')
        return `'${val}'`;

    else
        return String(val);
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

export async function getCss(template: TemplateDelegate, data: Obj = {}, options: Obj = {}): Promise<string> {
    const helpers = options?.helpers ?? {};
    const doGenerateGlobalStyles = Boolean(options?.doGenerateGlobalStyles ?? true);


    // Getting the CSS

    const generator = await uno;
    const html = getHtml(template, data, helpers);
    const { css } = await generator.generate(html, { preflights: doGenerateGlobalStyles });


    return css;
}


// Analyze Functions

export function unique<T = any>(arr: T[]): T[] {
    return [ ...new Set(arr) ];
}

export function getPaths(ast: AST.Program): string[] {
    const paths = new HandlebarsPathCollector().collect(ast);
    return unique(paths);
}

export function pathToDataModelNode(path: string, depth: number = DEFAULT_MODEL_DEPTH): DataModelNode {

    // Doing some checks

    if (depth <= 0)
        throw new PotentialLoopError('Flext: Unable to get the model: The model is too deep');


    // Getting the root node

    const [ name, ...items ] = path?.split('.') ?? [];

    const result: DataModelNode = { name };


    // If the node has children

    if (items?.length > 0)
        result.$ = [ pathToDataModelNode(items?.join('.') || '', depth - 1) ];


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

    for (const path of paths) {
        const test = (val: string): boolean => path.startsWith(val);

        if (test('.') || test('/') || test('@') || test('this'))
            continue; // TODO: kr: Costyl to skip 'this*' paths in AST
        else
            result.addPath(path);
    }


    return result;
}

export function dataModelNodeToMetadata(node: types.DataModelNode, fields: types.Field[], _options: types.Obj = {}, depth: number = DEFAULT_MODEL_DEPTH): types.MetadataModelNode {

    // Doing some checks

    if (depth <= 0)
        throw new errors.PotentialLoopError('Flext: Unable to get data model: The data model is too deep');


    // Defining the functions

    const getField = (_fieldName: string): types.Field | null => fields?.find(f => f?.name === _fieldName) ?? null;


    // Getting the data

    const fieldName = _options?.fieldName ?? node?.name ?? null;
    const field = getField(fieldName);
    const order = field?.order ?? null;
    const nodes = node?.$ ?? [];
    const type = nodes?.length ? 'object' : field?.type ?? DEFAULT_FIELD_TYPE;
    const name = node?.name ?? null;
    const label = field?.label ?? null;
    const hint = field?.hint ?? null;
    const min = field?.min ?? null;
    const max = field?.max ?? null;
    const minLength = field?.minLength ?? null;
    const maxLength = field?.maxLength ?? null;
    const options = field?.options ?? null;
    const isRequiredBool = field?.isRequired ?? null;


    // Getting the sub-nodes

    const newNodes: types.MetadataModelNode[] = [];

    for (const node of nodes) {
        const nodeName = node?.name ?? null;

        newNodes.push(dataModelNodeToMetadata(node, fields, {
            fieldName: fieldName + '.' + nodeName,
        }, depth - 1));
    }


    // Getting the ordered sub-nodes

    const $ =  newNodes.sort((node, nodeRef) => {
        const nodeFieldName = node?.extra?.fieldName ?? null;
        const nodeField: types.Obj = getField(nodeFieldName) ?? {};
        const nodeFieldOrder = nodeField?.order ?? null;
        const nodeFieldAbsoluteOrder = nodeField?.extra?.absoluteOrder ?? null;
        const nodeFieldNameRef = nodeRef?.extra?.fieldName ?? null;
        const nodeFieldRef: types.Obj = getField(nodeFieldNameRef) ?? {};
        const nodeFieldOrderRef = nodeFieldRef?.order ?? null;
        const nodeFieldAbsoluteOrderRef = nodeFieldRef?.extra?.absoluteOrder ?? null;

        if (compare(nodeFieldOrder, nodeFieldOrderRef) !== 0)
            return compare(nodeFieldOrder, nodeFieldOrderRef);
        else
            return compare(nodeFieldAbsoluteOrder, nodeFieldAbsoluteOrderRef);
    });


    // Getting the required

    const isAllChildrenRequired = newNodes?.length && newNodes.every(n => n?.isRequired);

    const isRequired = isset(isRequiredBool) ? isRequiredBool : isAllChildrenRequired;


    // Getting the extra

    const extra = { fieldName };


    return {
        type,
        name,
        label,
        hint,
        min,
        max,
        minLength,
        maxLength,
        order,
        options,
        isRequired,
        extra,
        $,
    };
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

        if (!matches) {
            if (doWarn)
                throw new BaseWarning('Flext: Unable to parse the macros: Bad macro: ' + audit(macroStr));
            else
                return null;
        }


        // Getting the data

        const name = matches?.groups?.name ?? null;
        const paramsStr = matches?.groups?.params ?? null;
        const params = getMacroParams(paramsStr, doWarn);


        result.push({ name, params });
    }


    return result;
}

export function getHtmlH1(ast: AST.Program, doWarn: boolean = true): string[] {
    const titleArr = new FlextH1SomewhereContentCollector().collect(ast);
    const result: string[] = [];


    // Iterating for each macro string

    for (const titleStr of titleArr) {
        const matches = titleStr?.trim()?.match(RegexHelper.htmlH1Somewhere) ?? null;


        // Doing some checks

        if (!matches) {
            if (doWarn)
                throw new BaseWarning('Flext: Unable to parse H1: Bad HTML: ' + audit(titleStr));
            else
                return null;
        }


        // Iterating for each match

        for (const match of matches)
            result.push(String(match));
    }


    return result;
}

export function getTemplateValidationErrorsByMetadata(data: types.Obj, model: types.MetadataModelNode[], depth: number = DEFAULT_MODEL_DEPTH): TemplateDataValidationError[] {

    // Doing some checks

    if (depth <= 0)
        throw new errors.PotentialLoopError('Flext: Unable to verify the data: The data model is too deep');


    // Getting the data

    const result: TemplateDataValidationError[] = [];


    // Defining the functions

    const isval = (val: any): boolean => !inarr(val, '', null, undefined);

    const len = (val: any): number => String(val).length;

    const err = (message: string, fieldName?: string|null): void => { result.push(new TemplateDataValidationError(message, fieldName)); };


    // Iterating for each child node

    for (const node of model) {

        // Getting the data

        const fieldNameStr = node?.extra?.fieldName ?? null;
        const fieldName = fieldNameStr ?? node?.name ?? 'Unknown';
        const fieldValue: types.Obj = data[node.name] ?? null;


        // If the value is required

        if (!isval(fieldValue) && node?.isRequired) {
            err(`Field '${fieldName}' is required (${audit(fieldValue)} is passed)`, fieldNameStr);
            continue;
        }


        // If the value has value range (e.g. 10 < value < 20)

        if (inarr(node?.type, 'number', 'date') && isval(node?.min) && isval(fieldValue) && node?.min > fieldValue) {
            err(`'${fieldName}' field value is less than the range (${audit(fieldValue)} is passed, the minimum is ${audit(node?.min)})`, fieldNameStr);
            continue;
        }

        if (inarr(node?.type, 'number', 'date') && isval(node?.max) && isval(fieldValue) && node?.max < fieldValue) {
            err(`'${fieldName}' field value is greater than the range (${audit(fieldValue)} is passed, the maximum is ${audit(node?.max)})`, fieldNameStr);
            continue;
        }


        // If the value has length range (e.g. 100 < length < 200)

        if (!inarr(node?.type, 'object', 'array', 'mixed') && isval(node?.minLength) && isval(fieldValue) && node?.minLength > len(fieldValue)) {
            err(`'${fieldName}' field value is shorter than the range (${audit(fieldValue)} is passed, the minimum is ${audit(node?.minLength)})`, fieldNameStr);
            continue;
        }

        if (!inarr(node?.type, 'object', 'array', 'mixed') && isval(node?.maxLength) && isval(fieldValue) && node?.maxLength < len(fieldValue)) {
            err(`'${fieldName}' field value is longer than the range (${audit(fieldValue)} is passed, the maximum is ${audit(node?.maxLength)})`, fieldNameStr);
            continue;
        }

        if (inarr(node?.type, 'string') && isNumber(node?.min) && isval(fieldValue) && Number(node?.min) > len(fieldValue)) {
            err(`'${fieldName}' field value is shorter than the range (${audit(fieldValue)} is passed, the minimum is ${audit(node?.min)})`, fieldNameStr);
            continue;
        }

        if (inarr(node?.type, 'string') && isNumber(node?.max) && isval(fieldValue) && Number(node?.max) < len(fieldValue)) {
            err(`'${fieldName}' field value is longer than the range (${audit(fieldValue)} is passed, the maximum is ${audit(node?.max)})`, fieldNameStr);
            continue;
        }


        result.push(...getTemplateValidationErrorsByMetadata(fieldValue ?? {}, node.$ as types.MetadataModelNode[], depth - 1));
    }


    return result;
}


// Framework Functions

export function ensureString(val: any): string {
    return String(val ?? '');
}

export function ensureNullableString(val: any): string|null {
    if (inarr(val, null, undefined))
        return null;
    else
        return ensureString(val);
}

export function ensureDate(val: Date | string | number): Date {
    const isDateObj = isObject(val) && val instanceof Date;
    const isDbDate = typeof val === 'string' && RegexHelper.dbDateStr.test(val);


    // Defining the functions

    const unixDate = (_val: string|number): Date => {
        const date = new Date(_val);

        if (isNaN(date.getTime()))
            throw new BaseWarning('Flext: Unable to get date: The date is invalid: ' + audit(_val));
        else
            return date;
    }

    const dbDate = (_val: string): Date => {
        const [ year, month, day ] = _val?.split('-')?.map(Number) ?? [];

        if (year && month && day)
            return DateTime.fromObject({ year, month, day }).toJSDate();
        else
            throw new BaseError('Unable to get date: The date is invalid: ' + audit(_val));
    }

    const isoDate = (_val: string): Date => {
        const date = DateTime.fromISO(_val);

        if (date.isValid)
            return date.toJSDate();
        else
            throw new BaseWarning('Flext: Unable to get date: The date is invalid: ' + audit(_val));
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
    let title: string|null = stripHtml(String(val)).trim();


    // Defining the functions

    const _filter = (search: string | RegExp, val: string = '') => title = title.replace(search, val);


    // Getting the title

    _filter('\n', ' ');
    _filter(/\s{2,}/mg, ' ');
    _filter(/[^\p{L}\d\s]/mgu);


    return title.trim();
}

export function ensureFieldName(val: string): string {
    let pathItem = val;


    // Defining the functions

    const _filter = (search: string, val: string = '') => pathItem = pathItem.replace(search, val);


    // Getting the path item

    _filter('['); // Filtering the '[n]' case
    _filter(']'); // Filtering the '[n]' case


    return pathItem.trim();
}

export function ensureNullableFieldMinMax(val: any): Date | number | null {
    if (isNumber(val))
        return val;
    else if (isObject(val) && val instanceof Date)
        return val;
    else
        return null;
}

export function ensureNullableFieldMinMaxLength(val: any): number|null {
    if (isNumber(val))
        return val;
    else
        return null;
}

export function ensureNullableFieldOrder(val: any): number|null {
    return isset(val) ? Number(val) : null;
}

export function ensureFieldValue(val: any): types.FieldValue {

    // If the value is a string

    if (typeof val !== 'string') try {
        return JSON.parse(val);
    } catch (e) {
        return val ?? null;
    }


    // If the value is other

    else return val ?? null;
}

export function filter(regex: RegExp, val: string|number): boolean {
    return !!String(val).trim().match(regex);
}

export function compare(a: number|null|undefined, b: number|null|undefined): number {
    if (!isset(a) && !isset(b))
        return 0;
    else if (!isset(a))
        return 1;
    else if (!isset(b))
        return -1;
    else
        return a - b;
}

export function macroToModuleNames(val: types.Macro): string[] {
    const params = val?.params ?? [];
    return params.map(p => p?.value ?? null);
}

export function macroToField(val: types.Macro): types.Field {
    const macroName = val?.name ?? null;
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

    const type = ensureString(get('type') ?? DEFAULT_FIELD_TYPE) as types.FieldType;
    const nameStr = ensureNullableString(nameParam?.value);
    const label = ensureNullableString(get('label'));
    const descr = ensureNullableString(get('descr'));
    const hint = ensureNullableString(get('hint'));
    const min = ensureNullableFieldMinMax(get('min'));
    const max = ensureNullableFieldMinMax(get('max'));
    const minLength = ensureNullableFieldMinMaxLength(get('minLength'));
    const maxLength = ensureNullableFieldMinMaxLength(get('maxLength'));
    const order = ensureNullableFieldOrder(get('order'));
    const value = ensureFieldValue(get('value'));
    const isRequired = !!get('required');


    // Doing some checks

    if (!nameStr)
        throw new errors.BaseError(`Unable to get field: The 'name' param is not set: ` + audit(nameStr));


    // Getting the name

    const name = ensureFieldName(nameStr);


    // Gettign the extra

    const extra = { macroName };


    return {
        type,
        name,
        label,
        descr,
        hint,
        min,
        max,
        minLength,
        maxLength,
        order,
        value,
        isRequired,
        extra,
    };
}

export function macroToFieldValueOption(val: types.Macro): types.FieldValueOption {
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

    const type = ensureString(get('type') ?? DEFAULT_FIELD_TYPE);
    const name = nameParam?.value ?? null;
    const fieldName = get('for') ?? null;
    const label = get('label') ?? null;
    const descr = get('descr') ?? null;
    const value = ensureFieldValue(get('value'));
    const isDisabled = !!get('disabled');


    // Doing some checks

    if (!name)
        throw new errors.BaseError(`Unable to get field option: The 'name' param is not set: ` + audit(name));

    if (!fieldName)
        throw new errors.BaseError(`Unable to get field option '${name}': The 'for' param is not set: ` + audit(name));


    return {
        type,
        name,
        fieldName,
        label,
        descr,
        value,
        isDisabled,
    };
}

export function applyValueOptionsToFields(options: types.FieldValueOption[], fields: types.Field[]): void {

    // Defining the functions

    const get = (fieldName: string): types.FieldValueOption[] => {
        return options?.filter(o => o?.fieldName === fieldName) ?? [];
    };


    // Iterating for each field

    for (const field of fields)
        if (get(field.name)?.length)
            field.options = get(field.name);
}

export function applyAbsoluteOrderToFields(fields: types.Field[]): void {
    for (const [ i, field ] of fields.entries()) {
        if (field?.extra)
            field.extra.absoluteOrder = i;
        else
            field.extra = { absoluteOrder: i };
    }
}

export function defineModule(options: any = {}): any {
    const helpers = options?.helpers ?? null;
    return { helpers };
}


// Helpers

export class RegexHelper {
    public static dbDateStr = /^\d+-\d+-\d+$/;
    public static macro = /^@(?<name>.+?) (?<params>.+)$/;
    public static macroParams = /(?<param>".+?")|(?<namedParam>[a-zA-Z0-9]+=".+?")|(?<simplaeParam>[a-zA-Z0-9]+)/gm;
    public static macroParam = /^"(?<value>.+)"$/;
    public static macroNamedParam = /^(?<name>.+)="(?<value>.+)"$/;
    public static macroSimpleParam = /^(?<name>[a-zA-Z]+)$/;
    public static htmlH1Somewhere = /\<h1.*?\>(?<value>.*)\<\/h1.*?\>/gs;
}

export class FilterHelper {
    public static macro(val: string): boolean {
        return filter(RegexHelper.macro, val);
    }

    public static htmlH1Somewhere(val: string): boolean {
        return filter(RegexHelper.htmlH1Somewhere, val);
    }
}
