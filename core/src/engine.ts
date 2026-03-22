import { AST } from '@handlebars/parser';
import { StandardDialect } from '@/dialects';
import * as types from '@/types';
import * as lib from '@/lib';
import * as errors from '@/errors';
import * as modules from '@/modules';
import {ProcessorInterface} from "@/types";


// Constants

export const DEFAULT_HELPER_NAME = '__default';

export const DEFAULT_MODEL_DEPTH = 10;


// Variables

export const standardDialect = new StandardDialect();


// Types

export type MacrosData = {
    lang?: string|null,
    timeZone?: string|null,
    title?: string|null,
    moduleNames?: string[] | null,
    lineHeight?: string|null,
    fields?: types.Field[] | null,
};


// Classes

export class SimpleProcessor implements types.SimpleProcessorInterface {
    declare public ast: AST.Program;
    declare public data: types.Obj;
    declare public helpers: types.Obj;
    public preprocessFunc: types.PreprocessTemplateHandler = defaultPreprocess;
    public parseFunc: types.ParseTemplateHandler = lib.hbsToAst;

    constructor(val: types.Template | null = null, data: types.Obj = {}, helpers: types.Obj = {}) {
        if (val) this.setTemplate(val);
        this.setData({ ...this.data, ...data });
        this.setHelpers({ ...this.helpers, ...helpers});
    }

    public templateToProcessed(val: types.Template): types.Template {
        return this.preprocessFunc(val);
    }

    public templateToAst(val: types.Template): AST.Program {
        return this.parseFunc(val);
    }

    public setTemplate(val: types.Template): this {

        // Clearing the data

        this.data = {};
        this.helpers = {};


        // Getting the AST

        const template = this.templateToProcessed(val);

        this.ast = this.templateToAst(template);


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

    public setPreprocessHandler(val: types.PreprocessTemplateHandler): this {
        this.preprocessFunc = val;
        return this;
    }

    public setParseHandler(val: types.ParseTemplateHandler): this {
        this.parseFunc = val;
        return this;
    }

    public getHtml(data?: types.Obj | null, helpers?: types.Obj | null): string {
        const template = lib.hbsToDelegate(this.ast);


        // Doing some checks

        if (!template)
            throw new errors.BaseError('Flext: Unable to get HTML: No template');


        return lib.delegateToHtml(
            template,
            data ?? this.data,
            helpers ?? this.helpers,
        );
    }

    public async getCss(data?: types.Obj | null, options: types.Obj = {}): Promise<string> {
        const template = lib.hbsToDelegate(this.ast);
        const helpersObj = options?.helpers ?? {};
        const helpers = { ...this.helpers, ...helpersObj };


        // Doing some checks

        if (!template)
            throw new errors.BaseError('Flext: Unable to get CSS: No template');


        return await lib.delegateToCss(
            template,
            data ?? this.data,
            { ...options, helpers },
        );
    }

    public get html(): string {
        return this.getHtml();
    }
}

export class Processor extends SimpleProcessor implements ProcessorInterface {
    declare public lang: string;
    declare public title: string;
    declare public timeZone: string;
    declare public lineHeight: number;
    declare public dialect: types.DialectInterface;
    declare public assets: types.Obj<Blob>;
    declare public fields: types.Field[];
    public getTitleFunc: types.GetTemplateTitleHandler = lib.delegateToHtmlH1;
    public getMacroFunc: types.GetTemplateMacroHandler = lib.astToMacros;

    constructor(val: types.Template | null = null, data: types.Obj = {}, helpers: types.Obj = {}) {
        super(null, data, helpers);

        if (val) this.setTemplate(val);
        this.setData({ ...this.data, ...data });
        this.setHelpers({ ...this.helpers, ...helpers});
    }

    public templateToProcessed(val: types.Template): types.Template {
        const dialect = this.dialect ?? standardDialect;
        return dialect.templateToStandard(val);
    }

    public useModule(...val: string[]): this {
        for (const name of val)
            this.addModule(name, modules[name]);

        return this;
    }

    public setTemplate(val: types.Template): this {

        // Setting the template

        super.setTemplate(val);


        // Defining the variables

        const [ titleStr ] = this.getTitleFunc(this.ast);

        const macros = this.getMacroFunc(this.ast);


        // Getting the data

        const { lang, timeZone, title, moduleNames, lineHeight, fields } = macrosToData(macros);


        // Setting the data

        if (lang)
            this.setLang(lang);

        if (timeZone)
            this.setTimeZone(timeZone);

        if (title || titleStr)
            this.setTitle(title ?? lib.ensureTitle(titleStr));

        if (lineHeight)
            this.setLineHeight(Number(lineHeight));

        if (fields && fields?.length)
            this.setFields(fields);


        // Using the modules

        this.useModule(...moduleNames);


        return this;
    }

    public setDialect(val: types.DialectInterface): this {
        this.dialect = val;
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

            const helper = function (..._args: any[]): any {
                const args = _args?.slice(0, -1) ?? [];
                const options = _args[_args.length - 1] ?? {};
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

    public setTitleHandler(val: types.GetTemplateTitleHandler): this {
        this.getTitleFunc = val;
        return this;
    }

    public setMacroHandler(val: types.GetTemplateMacroHandler): this {
        this.getMacroFunc = val;
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

        const model = lib.astToDataModel(this.ast);
        const nodes: types.DataModelNode[] = model?.$ ?? [];


        return nodes.filter(isValid).map(dataModelNodeToMetadata);
    }

    public getValidationErrors(data?: types.Obj | null, depth: number = DEFAULT_MODEL_DEPTH): errors.TemplateDataValidationError[] {
        return lib.hbsToDelegateValidationErrorsByMetadata(data ?? this.data, this.model, depth);
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

export function macrosToData(macros: types.Macro[]): MacrosData {

    // Defining the functions

    const getAll = (..._val: string[]): types.Macro[] | null => macros?.filter(m => lib.inarr(m?.name, ..._val)) ?? null;

    const get = (_val: string): string | null => {
        const [ macro ] = getAll(_val);
        const [ param ] = macro?.params ?? [];

        return param?.value ?? null;
    };


    // Getting the data

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


    // Getting the modules

    const moduleNames = modulesMacros.map(lib.macroToModuleNames).flat();


    return { lang, timeZone, title, moduleNames, lineHeight, fields };
}

export function defaultPreprocess(val: types.Template): types.Template {
    return val;
}


export default Processor;
