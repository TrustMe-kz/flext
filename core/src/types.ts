import { AST } from '@handlebars/parser';


// Base Data Types

export type Html = string;

export type Css = string;

export type Obj<T extends any = any> = Record<string, T>;

export type Isset<T extends any> = T extends null|undefined ? false : true;

export type IsNumber<T extends any> = T extends number ? true : false;

export type IsObject<T extends any, O extends Obj = Obj> = T extends O ? true : false;

export type Has<T extends Obj, K extends keyof T> = T[K];

export type Inarr<T extends any, A extends any[]> = T extends A[any] ? true : false;

export type Hbs = string;

export type Template = Hbs;

export type StandardTemplate = Template;

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'mixed';

export type FieldValue = string | number | boolean | Obj | FieldValue[] | null;


// Base Struct Types

export type MacroParam = {
    name: string,
    value: string|null,
};

export type Macro = {
    name: string,
    params: MacroParam[],
};

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
    min?: Date | number | null,
    max?: Date | number | null,
    minLength?: number|null,
    maxLength?: number|null,
    order?: number|null,
    options?: FieldValueOption[] | null,
    value?: FieldValue,
    isRequired: boolean,
    extra?: {
        macroName?: string|null,
        absoluteOrder?: number|null,
    }
};

export type DataModelNode = {
    name: string,
    $?: DataModelNode[],
};

export type DataModel = DataModelNode & {
    addPath: (path: string, depth?: number) => void,
};

export type MetadataModelNode = DataModelNode & {
    type: FieldType,
    label?: string|null,
    descr?: string|null,
    hint?: string|null,
    min?: Date | number | null,
    max?: Date | number | null,
    minLength?: number|null,
    maxLength?: number|null,
    order?: number|null,
    options?: FieldValueOption[] | null,
    value?: string|null,
    isRequired: boolean,
    extra?: {
        fieldName?: string|null,
    },
};


// Base Interfaces

export interface DialectInterface {
    name: string,
    aliases: string[],
    testAst: DialectTemplateTestAstHandler,
    test(val: Template | AST.Program): boolean,
    templateToStandard(val: Template): StandardTemplate,
}

export interface SimpleProcessorInterface {
    ast: AST.Program,
    data: Obj,
    helpers: Obj,
    preprocessFunc: PreprocessTemplateHandler,
    parseFunc: ParseTemplateHandler,
    readonly html: string,

    templateToProcessed(val: Template): Template,
    templateToAst(val: Template): AST.Program,
    setTemplate(val: Template): this,
    setData(val: Obj): this,
    setHelpers(val: Obj): this,
    addHelper(name: string, val: any): this,
    setPreprocessHandler(val: PreprocessTemplateHandler): this,
    setParseHandler(val: ParseTemplateHandler): this,
    getHtml(data?: Obj | null, helpers?: Obj | null): string,
    getCss(data?: Obj | null, options?: Obj): Promise<string>,
}

export interface ProcessorInterface extends SimpleProcessorInterface {
    lang: string,
    title: string,
    timeZone: string,
    lineHeight: number,
    dialect: DialectInterface,
    assets: Obj<Blob>,
    fields: Field[],
    getTitleFunc: GetTemplateTitleHandler,
    getMacroFunc: GetTemplateMacroHandler,
    readonly model: MetadataModelNode[],
    readonly validationErrors: Error[],
    readonly errors: Error[],
    readonly isValid: boolean,

    templateToProcessed(val: Template): Template,
    useModule(...val: string[]): this,
    setTemplate(val: Template): this,
    setDialect(val: DialectInterface): this,
    setLang(val: string): this,
    setTitle(val: string): this,
    setTimeZone(val: string): this,
    setLineHeight(val: number): this,
    setAssets(val: Obj<Blob>): this,
    addAsset(name: string, val: Blob): this,
    setFields(val: Field[]): this,
    addModule(name: string, val: any): this,
    setTitleHandler(val: GetTemplateTitleHandler): this,
    setMacroHandler(val: GetTemplateMacroHandler): this,
    getDataModel(depth?: number): MetadataModelNode[],
    getValidationErrors(data?: Obj | null, depth?: number): Error[],
    getIsValid(data?: Obj | null, depth?: number): boolean,
}


// Base Callable Types

export type CollectorFilterHandler<T = any> = (val?: T | null) => boolean;

export type DialectTemplateTestAstHandler = (val: AST.Program) => boolean;

export type DialectTemplateToStandardHandler = (val: Template) => StandardTemplate;

export type PreprocessTemplateHandler = (val: Template) => StandardTemplate;

export type ParseTemplateHandler = (val: StandardTemplate) => AST.Program;

export type GetTemplateTitleHandler = (ast: AST.Program) => string[];

export type GetTemplateMacroHandler = (ast: AST.Program) => Macro[];
