import { DateTime } from 'luxon';
import { AST } from '@handlebars/parser';
import { createGenerator, presetTypography } from 'unocss';
import { presetWind4 } from '@unocss/preset-wind4';
import { BaseError, BaseWarning, PotentialLoopError, TemplateDataValidationError } from '@/errors';
import striptags from 'striptags';
import unocssShadowDomHack from './unocssShadowDomHack.css';
import Handlebars, { TemplateDelegate } from 'handlebars';
import * as types from '@/types';


// Third-parties

export const uno = createGenerator({
    presets: [
        presetWind4(),
        presetTypography(),
    ],
    preflights: [
        // @remarks NOTE: kr: UnoCSS needs a hack to make Shadow DOM work in Tailwind v4
        // @see https://github.com/tailwindlabs/tailwindcss/discussions/15556
        { getCSS: () => unocssShadowDomHack },
    ],
    theme: {},
});


// Constants

export const DEFAULT_MODEL_DEPTH = 10;

export const DEFAULT_FIELD_TYPE: types.FieldType = 'string';


// Variables

export const stripHtml = striptags;


// Classes

export class HandlebarsCollector<T = any> extends Handlebars.Visitor {
    public data: T[] = [];
    public match: types.CollectorFilterHandler<T> = () => true;

    constructor(filter?: types.CollectorFilterHandler<T>) {
        super();
        if (filter) this.setMatchHandler(filter);
    }

    public onCollect(val: T): void {
        if (this.match(val))
            this.data.push(val);
    }

    public setMatchHandler(val: types.CollectorFilterHandler<T>): this {
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

export function inarr<T extends any, A extends any[]>(val: T, ...arr: A): types.Inarr<T, A> {
    return arr.includes(val) as types.Inarr<T, A>;
}

export function has<T extends types.Obj, K extends keyof T>(obj: T, key: K): types.Has<T, K> {
    return obj.hasOwnProperty(key) as types.Has<T, K>;
}

export function isset<T extends any>(val: T): types.Isset<T> {
    return !inarr(val, null, undefined) as types.Isset<T>;
}

export function isNumber<T extends any>(val: T): types.IsNumber<T> {
    return (isset(val) && !isNaN(Number(val))) as types.IsNumber<T>;
}

export function isObject<T extends any>(val: T): types.IsObject<T> {
    return (typeof val === 'object' && val !== null) as types.IsObject<T>;
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

export function getHtml(template: TemplateDelegate, data: types.Obj = {}, helpers: types.Obj = {}): string {
    return template(data, { helpers });
}

export async function getCss(template: TemplateDelegate, data: types.Obj = {}, options: types.Obj = {}): Promise<string> {
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

export function pathToDataModelNode(path: string, depth: number = DEFAULT_MODEL_DEPTH): types.DataModelNode {

    // Doing some checks

    if (depth <= 0)
        throw new PotentialLoopError('Flext: Unable to get the model: The model is too deep');


    // Getting the root node

    const [ name, ...items ] = path?.split('.') ?? [];

    const result: types.DataModelNode = { name };


    // If the node has children

    if (items?.length > 0)
        result.$ = [ pathToDataModelNode(items?.join('.') || '', depth - 1) ];


    return result;
}

export function pathToDataModel(path: string, depth: number = DEFAULT_MODEL_DEPTH): types.DataModel {
    const node: any = pathToDataModelNode(path, depth);
    const dataModel: any = { name: 'root', $: [ node ] };


    // Defining the methods

    dataModel.addPath = (_path: string, _depth: number = DEFAULT_MODEL_DEPTH): void => {
        const newNode = pathToDataModelNode(_path, _depth);
        let cursorRef: types.DataModelNode = dataModel;
        let cursor: types.DataModelNode | null = newNode;


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

export function getDataModel(ast: AST.Program): types.DataModel {
    const [ first, ...paths ] = getPaths(ast);
    const result: types.DataModel = pathToDataModel(first);


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
        throw new PotentialLoopError('Flext: Unable to get data model: The data model is too deep');


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

export function getMacroParam(val: string): types.MacroParam | null {

    // Defining the functions

    const match = (regex: RegExp): any => val?.match(regex) ?? null;

    const get = (val: any): types.MacroParam => {
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

export function getMacroParams(val: string, doWarn: boolean = true): types.MacroParam[] {
    const matches = val?.match(RegexHelper.macroParams) ?? [];
    const result: types.MacroParam[] = [];


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

export function getMacros(ast: AST.Program, doWarn: boolean = true): types.Macro[] {
    const macroArr = new FlextMacroCollector().collect(ast);
    const result: types.Macro[] = [];


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
        throw new PotentialLoopError('Flext: Unable to verify the data: The data model is too deep');


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

export function ensureDate<T extends boolean = true>(val: Date | string | number, doWarn: T = true as T): T extends true ? Date : Date | null {
    const isDateObj = isObject(val) && val instanceof Date;
    const isDbDate = typeof val === 'string' && RegexHelper.dbDateStr.test(val);


    // Defining the functions

    const unixDate = <R extends boolean = true>(_val: string|number, _doWarn: R = true as R): R extends true ? Date : Date | null => {
        const date = new Date(_val);

        if (isNaN(date.getTime()) && _doWarn)
            throw new BaseWarning('Flext: Unable to get date: The date is invalid: ' + audit(_val));
        else if (isNaN(date.getTime()))
            return null;
        else
            return date;
    }

    const dbDate = <R extends boolean = true>(_val: string, _doWarn: R = true as R): R extends true ? Date : Date | null => {
        const [ year, month, day ] = _val?.split('-')?.map(Number) ?? [];

        if (year && month && day)
            return DateTime.fromtypes.Object({ year, month, day }).toJSDate();
        else if (_doWarn)
            throw new BaseError('Flext: Unable to get date: The date is invalid: ' + audit(_val));
        else
            return null;
    }

    const isoDate = <R extends boolean = true>(_val: string, _doWarn: R = true as R): R extends true ? Date : Date | null => {
        const date = DateTime.fromISO(_val);

        if (date.isValid)
            return date.toJSDate();
        else if (_doWarn)
            throw new BaseWarning('Flext: Unable to get date: The date is invalid: ' + audit(_val));
        else
            return null;
    }


    if (isDateObj)
        return val as Date;

    if (isNumber(val))
        return unixDate(val as number, doWarn);

    else if (isDbDate)
        return dbDate(val as string, doWarn);

    else
        return isoDate(val as string, doWarn);
}

export function ensureTitle(val: string|number): string {
    let title: string|null = stripHtml(String(val)).trim();


    // Defining the functions

    const filter = (search: string | RegExp, val: string = '') => title = title.replace(search, val);


    // Getting the title

    filter('\n', ' ');
    filter(/\s{2,}/mg, ' ');
    filter(/[^\p{L}\d\s]/mgu);


    return title.trim();
}

export function ensureFieldName(val: string): string {
    let pathItem = val;


    // Defining the functions

    const filter = (search: string, val: string = '') => pathItem = pathItem.replace(search, val);


    // Getting the path item

    filter('['); // Filtering the '[n]' case
    filter(']'); // Filtering the '[n]' case


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

export function sum(...args: number[]): number {
    return args.reduce((acc, val) => Number(acc) + Number(val), 0);
}

export function matches(regex: RegExp, val: string|number): boolean {
    return !!String(val).trim().match(regex);
}

export function compare(val: number|null|undefined, valRef: number|null|undefined): number {
    if (!isset(val) && !isset(valRef))
        return 0;
    else if (!isset(val))
        return 1;
    else if (!isset(valRef))
        return -1;
    else
        return val - valRef;
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
        throw new BaseError(`Unable to get field: The 'name' param is not set: ` + audit(nameStr));


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
        throw new BaseError(`Unable to get field option: The 'name' param is not set: ` + audit(name));

    if (!fieldName)
        throw new BaseError(`Unable to get field option '${name}': The 'for' param is not set: ` + audit(name));


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
        return matches(RegexHelper.macro, val);
    }

    public static htmlH1Somewhere(val: string): boolean {
        return matches(RegexHelper.htmlH1Somewhere, val);
    }
}
