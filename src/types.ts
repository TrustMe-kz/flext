import { AST } from '@handlebars/parser';


// Base Data Types

export type Obj<T extends any = any> = Record<string, T>;

export type Inarr<T extends any, A extends any[]> = T extends A[any] ? true : false;

export type Isset<T extends any> = T extends null|undefined ? false : true;

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
    order?: number|null,
    options?: FieldValueOption[] | null,
    value?: string|null,
    isRequired: boolean,
    extra?: {
        fieldName?: string|null,
    },
};


// Base Callable Types

export type CollectorFilterHandler<T = any> = (val?: T) => boolean;

export type GetProcessedTemplateHandler = (val: string) => string;

export type GetTemplateAstHandler = (val: string) => AST.Program;

export type GetTemplateTitleHandler = (ast: AST.Program) => string[];

export type GetTemplateMacroHandler = (ast: AST.Program) => Macro[];
