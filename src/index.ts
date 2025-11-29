import { AST } from '@handlebars/parser';
import { Obj, DataModelNode, Macro } from '@/types';
import { BaseError, PotentialLoopError } from '@/errors';
import { audit, isset, getAst, getTemplate, getHtml, getCss, getDataModel, getMacros, getHtmlH1, ensureString, ensureTitle, ensureFieldName, compare } from '@/lib';
import { inarr, has } from '@/lib';
import * as modules from './modules';


// Types

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'mixed';

export type FieldValue = string | number | boolean | Obj | FieldValue[] | null;

export type FieldValueOption = {
    type: string,
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
    order?: number|null,
    options?: FieldValueOption[] | null,
    value?: FieldValue,
    isRequired: boolean,
    extra?: {
        macroName?: string|null,
        absoluteOrder?: number|null,
    }
};

export type MetadataModelNode = DataModelNode & {
    type: FieldType,
    label?: string|null,
    descr?: string|null,
    hint?: string|null,
    order?: number|null,
    options?: FieldValueOption[] | null,
    value?: string|null,
    isRequired: boolean,
    extra?: {
        fieldName?: string|null,
    },
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
        if (val) this.setTemplate(val);
        this.setData({ ...this.data, ...data });
        this.setHelpers({ ...this.helpers, ...helpers});
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
    declare public assets: Obj<Blob>;
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

        const getAll = (..._val: string[]): Macro[] | null => macros?.filter(m => inarr(m?.name, ..._val)) ?? null;

        const get = (_val: string): string|null => {
            const [ macro ] = getAll(_val);
            const [ param ] = macro?.params ?? [];

            return param?.value ?? null;
        };


        // Getting the data

        const version = get('v');
        const lang = get('lang');
        const title = get('title');
        const timeZone = get('timeZone');
        const modulesMacros = getAll('use');
        const lineHeight = get('lineHeight');
        const optionMacros = getAll('option');
        const fieldMacros = getAll('group', 'field');


        // Getting the fields

        const fieldValueOptions = optionMacros?.map(macroToFieldValueOption) ?? null;
        const fields = fieldMacros?.map(macroToField) ?? [];

        applyValueOptionsToFields(fieldValueOptions, fields);
        applyAbsoluteOrderToFields(fields);


        // Getting the field groups

        const fieldGroups = fields.filter(f => f?.extra?.macroName === 'group');

        for (const fieldGroup of fieldGroups)
            fieldGroup.type = 'object';


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

        if (fields && fields?.length)
            this.setFields(fields);


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

    public setAssets(val: Obj<Blob>): this {
        this.assets = val;
        return this;
    }

    public addAsset(name: string, val: Blob): this {
        this.assets[name] = val;
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

        const getMetadataModelNode = (node: DataModelNode, _options: Obj = {}, _depth: number = DEFAULT_MODEL_DEPTH): MetadataModelNode => {

            // Doing some checks

            if (_depth <= 0)
                throw new PotentialLoopError('Flext: Unable to get data model: The data model is too deep');


            // Defining the functions

            const get = (_fieldName: string): Field | null => this.fields?.find(f => f?.name === _fieldName) ?? null;


            // Getting the field

            const fieldName = _options?.fieldName ?? null;
            const field = get(fieldName);
            const order = field?.order ?? null;


            // Getting the data

            const nodes = node?.$ ?? [];
            const type = nodes?.length ? 'object' : field?.type ?? DEFAULT_FIELD_TYPE;
            const name = node?.name ?? null;
            const label = field?.label ?? null;
            const hint = field?.hint ?? null;
            const options = field?.options ?? null;
            const isRequired = !!field?.isRequired;


            // Getting the sub-nodes

            const newNodes: MetadataModelNode[] = [];

            for (const node of nodes) {
                const nodeName = node?.name ?? null;

                newNodes.push(getMetadataModelNode(node, {
                    fieldName: fieldName + '.' + nodeName,
                }, _depth - 1));
            }


            // Getting the ordered sub-nodes

            const $ =  newNodes.sort((node, nodeRef) => {
                const nodeFieldName = node?.extra?.fieldName ?? null;
                const nodeField: Obj = get(nodeFieldName) ?? {};
                const nodeFieldOrder = nodeField?.order ?? null;
                const nodeFieldAbsoluteOrder = nodeField?.extra?.absoluteOrder ?? null;
                const nodeFieldNameRef = nodeRef?.extra?.fieldName ?? null;
                const nodeFieldRef: Obj = get(nodeFieldNameRef) ?? {};
                const nodeFieldOrderRef = nodeFieldRef?.order ?? null;
                const nodeFieldAbsoluteOrderRef = nodeFieldRef?.extra?.absoluteOrder ?? null;

                if (compare(nodeFieldOrder, nodeFieldOrderRef) !== 0)
                    return compare(nodeFieldOrder, nodeFieldOrderRef);
                else
                    return compare(nodeFieldAbsoluteOrder, nodeFieldAbsoluteOrderRef);
            });


            // Getting the extra

            const extra = { fieldName };


            return { type, name, label, hint, order, options, isRequired, extra, $ };
        }

        const isHelperCall = (node: DataModelNode): boolean => {
            for (const helperName in this.helpers) {
                if (!has(this.helpers, helperName))
                    continue;
                else if (node?.name === helperName)
                    return true;
            }

            return false;
        }


        // Getting the nodes

        const model = getDataModel(this.ast);

        const nodes: DataModelNode[] = model?.$ ?? [];


        return nodes
            .filter(n => !isHelperCall(n))
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

export function ensureFieldOrder(val: any): number|null {
    return isset(val) ? Number(val) : null;
}

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

    const type = get('type') ?? DEFAULT_FIELD_TYPE;
    const nameStr = nameParam?.value ?? null;
    const label = get('label') ?? null;
    const descr = get('descr') ?? null;
    const hint = get('hint') ?? null;
    const order = ensureFieldOrder(get('order'));
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
        order,
        value,
        isRequired,
        extra,
    };
}

export function macroToFieldValueOption(val: Macro): FieldValueOption {
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

export function applyValueOptionsToFields(options: FieldValueOption[], fields: Field[]): void {

    // Defining the functions

    const get = (fieldName: string): FieldValueOption[] => {
        return options?.filter(o => o?.fieldName === fieldName) ?? [];
    };


    // Iterating for each field

    for (const field of fields)
        if (get(field.name)?.length)
            field.options = get(field.name);
}

export function applyAbsoluteOrderToFields(fields: Field[]): void {
    for (const [ i, field ] of fields.entries()) {
        if (field?.extra)
            field.extra.absoluteOrder = i;
        else
            field.extra = { absoluteOrder: i };
    }
}


export default Flext;
