import { AST } from '@handlebars/parser';
import { Obj, Macro, Field, FieldType, FieldValue, FieldValueOption, DataModel, DataModelNode, MetadataModelNode, CollectorFilterHandler, GetTemplateAstHandler, GetTemplateTitleHandler, GetTemplateMacroHandler } from '@/types';
import { BaseThrowable, BaseWarning, BaseError, PotentialLoopError, TemplateError, TemplateSyntaxError, TemplateDataValidationError } from '@/errors';
import * as types from '@/types';
import * as lib from '@/lib';
import * as errors from '@/errors';
import * as modules from './modules';


// Constants

export const DEFAULT_HELPER_NAME = '__default';

export const DEFAULT_MODEL_DEPTH = 10;


// Classes

export class SimpleFlext  {
    declare public ast: AST.Program;
    declare public data: types.Obj;
    declare public helpers: types.Obj;
    public onGetProcessed: types.GetProcessedTemplateHandler = defaultGetProcessed;
    public onGetAst: types.GetTemplateAstHandler = lib.getAst;

    constructor(val: string|null = null, data: types.Obj = {}, helpers: types.Obj = {}) {
        if (val) this.setTemplate(val);
        this.setData({ ...this.data, ...data });
        this.setHelpers({ ...this.helpers, ...helpers});
    }

    public setTemplate(val: string): this {

        // Clearing the data

        this.data = {};
        this.helpers = {};


        // Getting the AST

        const template = this.onGetProcessed(val);

        this.ast = this.onGetAst(template);


        return this;
    }

    public setData(val: types.Obj): this {
        this.data = val;
        return this;
    }

    public setHelpers(val: types.Obj): this {
        this.helpers = val;
        return this;
    }

    public addHelper(name: string, val: any): this {
        this.helpers[name] = val;
        return this;
    }

    public setOnGetProcessed(val: types.GetProcessedTemplateHandler): this {
        this.onGetProcessed = val;
        return this;
    }

    public setOnGetAst(val: types.GetTemplateAstHandler): this {
        this.onGetAst = val;
        return this;
    }

    public getHtml(data?: types.Obj | null, helpers?: types.Obj | null): string {
        const template = lib.getTemplate(this.ast);


        // Doing some checks

        if (!template)
            throw new errors.BaseError('Flext: Unable to get HTML: No template');


        return lib.getHtml(
            template,
            data ?? this.data,
            helpers ?? this.helpers,
        );
    }

    public async getCss(data?: types.Obj | null, options: types.Obj = {}): Promise<string> {
        const template = lib.getTemplate(this.ast);
        const helpersObj = options?.helpers ?? {};
        const helpers = { ...this.helpers, ...helpersObj };


        // Doing some checks

        if (!template)
            throw new errors.BaseError('Flext: Unable to get CSS: No template');


        return await lib.getCss(
            template,
            data ?? this.data,
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
    declare public assets: types.Obj<Blob>;
    declare public fields: types.Field[];
    public onGetTitle: types.GetTemplateTitleHandler = lib.getHtmlH1;
    public onGetMacro: types.GetTemplateMacroHandler = lib.getMacros;

    constructor(val: string|null = null, data: types.Obj = {}, helpers: types.Obj = {}) {
        super(null, data, helpers);

        if (val) this.setTemplate(val);
        this.setData({ ...this.data, ...data });
        this.setHelpers({ ...this.helpers, ...helpers});
    }

    public useModule(...val: string[]): this {
        for (const name of val)
            this.addModule(name, modules[name]);

        return this;
    }

    public setTemplate(val: string): this {

        // Setting the template

        super.setTemplate(val);


        // Defining the variables

        const [ titleStr ] = this.onGetTitle(this.ast);

        const macros = this.onGetMacro(this.ast);


        // Defining the functions

        const getAll = (..._val: string[]): types.Macro[] | null => macros?.filter(m => lib.inarr(m?.name, ..._val)) ?? null;

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

        const fieldValueOptions = optionMacros?.map(lib.macroToFieldValueOption) ?? null;
        const fields = fieldMacros?.map(lib.macroToField) ?? [];

        lib.applyValueOptionsToFields(fieldValueOptions, fields);
        lib.applyAbsoluteOrderToFields(fields);


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
            this.setTitle(title ?? lib.ensureTitle(titleStr));

        if (timeZone)
            this.setTimeZone(timeZone);

        if (lineHeight)
            this.setLineHeight(Number(lineHeight));

        if (fields && fields?.length)
            this.setFields(fields);


        // Using the modules

        const moduleNames = modulesMacros.map(lib.macroToModuleNames).flat();

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

    public setAssets(val: types.Obj<Blob>): this {
        this.assets = val;
        return this;
    }

    public addAsset(name: string, val: Blob): this {
        this.assets[name] = val;
        return this;
    }

    public setFields(val: types.Field[]): this {
        this.fields = val;
        return this;
    }

    public addModule(name: string, val: any): this {
        const helpers = val?.helpers ?? {};


        // Iterating for each helper

        for (const helperName in helpers) {
            if (!lib.has(helpers, helperName)) continue;


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

    public setOnGetTitle(val: types.GetTemplateTitleHandler): this {
        this.onGetTitle = val;
        return this;
    }

    public setOnGetMacro(val: types.GetTemplateMacroHandler): this {
        this.onGetMacro = val;
        return this;
    }

    public getDataModel(depth: number = DEFAULT_MODEL_DEPTH): types.MetadataModelNode[] {

        // Defining the functions

        /**
         * TODO: kr: Costyl: Detects if it is a helper call (like 'put:noColor')
         */
        const isHelper = (node: types.DataModelNode): boolean => {
            for (const helperName in this.helpers) {
                if (!lib.has(this.helpers, helperName))
                    continue;
                else if (node?.name === helperName)
                    return true;
            }

            return false;
        }

        /**
         * TODO: kr: Costyl: Filters the helper calls (like 'put:noColor')
         */
        const isValid = (node: types.DataModelNode): boolean => !isHelper(node);

        const dataModelNodeToMetadata = (node: types.DataModelNode): types.MetadataModelNode => lib.dataModelNodeToMetadata(node, this.fields, {}, depth);


        // Getting the nodes

        const model = lib.getDataModel(this.ast);
        const nodes: types.DataModelNode[] = model?.$ ?? [];


        return nodes.filter(isValid).map(dataModelNodeToMetadata);
    }

    public getValidationErrors(data?: types.Obj | null, depth: number = DEFAULT_MODEL_DEPTH): errors.TemplateDataValidationError[] {
        return lib.getTemplateValidationErrorsByMetadata(data ?? this.data, this.model, depth);
    }

    public getIsValid(data?: types.Obj | null, depth: number = DEFAULT_MODEL_DEPTH): boolean {
        const errors = this.getValidationErrors(data ?? this.data, depth);
        return !errors?.length;
    }

    public get model(): types.MetadataModelNode[] {
        return this.getDataModel();
    }

    public get validationErrors(): errors.TemplateDataValidationError[] {
        return this.getValidationErrors();
    }

    public get errors(): errors.BaseError[] {
        return this.validationErrors;
    }

    public get isValid(): boolean {
        return this.getIsValid();
    }
}


// Functions

export function defaultGetProcessed(val: string): string {
    return val;
}


export default Flext;

export {
    Obj,
    Macro,
    Field,
    FieldType,
    FieldValue,
    FieldValueOption,
    DataModel,
    DataModelNode,
    MetadataModelNode,
    CollectorFilterHandler,
    GetTemplateAstHandler,
    GetTemplateTitleHandler,
    GetTemplateMacroHandler,

    BaseThrowable,
    BaseWarning,
    BaseError,
    PotentialLoopError,
    TemplateError,
    TemplateSyntaxError,
    TemplateDataValidationError,

    types,
    lib,
    errors,
    modules,
};
