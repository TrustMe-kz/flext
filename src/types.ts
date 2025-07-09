export type Obj<T = any> = Record<string, T>;

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
