export type Obj<T = any> = Record<string, T>;

export type MacroParam = {
    name: string,
    value: string|null,
};

export type Macro = {
    name: string,
    params: MacroParam[],
};
