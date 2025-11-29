
// Base Data Types

export type Obj<T extends any = any> = Record<string, T>;

export type Inarr<T extends any, A extends any[]> = T extends A[any] ? true : false;

export type Isset<T extends any> = T extends null|undefined ? false : true;


// Base Struct Types

export type DataModelNode = {
    name: string,
    $?: DataModelNode[],
};

export type DataModel = DataModelNode & {
    addPath: (path: string, depth?: number) => void,
};

export type MacroParam = {
    name: string,
    value: string|null,
};

export type Macro = {
    name: string,
    params: MacroParam[],
};
