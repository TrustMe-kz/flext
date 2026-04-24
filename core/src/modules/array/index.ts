import { Obj } from '@/types';
import { defineModule, audit, isset, isObject } from '@/lib';
import { TemplateDataError } from '@/errors';


// Functions

export function op(state: any): any[] | string | number | boolean | null {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ op, arr, arg, ...rest ] = args;
    const { separator = ' ', strict, all, start, end } = namedArgs;


    // Doing some checks

    if (op === 'check')
        return Array.isArray(arr);

    if (!Array.isArray(arr))
        throw new TemplateDataError(`Array: Unable to perform '${op}': The given value is not an array: ${audit(arr)}`);


    // Defining he functions

    const destruct = <T extends any = any>(val: Obj[], _arg: string): T[] => {
        const items = _arg?.split('.') ?? [];
        const result: T[] = [];


        // Iterating for each item

        for (const obj of val) {
            let cursor: any = obj;

            for (const item of items) cursor = cursor[item];

            result.push(cursor);
        }


        return result;
    };

    const reverse = (arr: any[]): any[] => {
        const result: any[] = [];

        for (let i = arr.length - 1; i >= 0; i--)
            result.push(arr[i]);

        return result;
    };

    const _contains = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (strict && arr?.indexOf(valRef) >= 0)
                return true;
            else if (arr?.some(i => JSON.stringify(i) === JSON.stringify(valRef)))
                return true;
        }

        return false;
    };

    const containsAll = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (strict && arr?.indexOf(valRef) < 0)
                return false;
            else if (isObject(valRef) && !arr?.some(i => isObject(i) && JSON.stringify(i) === JSON.stringify(valRef)))
                return false;
            else if (!arr?.some(i => i == valRef))
                return false;
        }

        return true;
    };

    const concat = (...args: any[]): any[] => {
        let result: any[] = [];

        for (const _arr of args) {
            if (!Array.isArray(_arr))
                throw new TemplateDataError(`Array: Unable to perform '${op}': The given param is not an array: ${audit(arg)}`);

            for (const item of _arr)
                result.push(item);
        }

        return result;
    }


    // Applying the operation

    switch (op) {
        case 'string':
            return arr.join(separator);
        case 'destruct':
            return destruct(arr, arg);
        case 'length':
            return arr.length;
        case 'empty':
            return arr.length === 0;
        case 'reverse':
            return reverse(arr);
        case 'contains':
            return all ? containsAll(arg, ...rest) : _contains(arg, ...rest);
        case 'first':
            return arr[0];
        case 'last':
            return arr[arr.length - 1];
        case 'slice':
            return isset(end) ? arr.slice(start, end) : arr.slice(start);
        case 'concat':
            return concat(arr, arg, ...rest);
        case 'unique':
            return [ ...new Set(arr) ];
        default:
            return arr;
    }
}

export function string(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'string', arr ] }) as string;
}

export function destruct(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ arr, prop ] = args;

    return op({ ...state, args: [ 'destruct', arr, prop ] }) as any[];
}

export function length(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'length', arr ] }) as any[];
}

export function empty(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'empty', arr ] }) as boolean;
}

export function reverse(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'reverse', arr ] }) as any[];
}

export function contains(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ arr, ...rest ] = args;

    return op({ ...state, args: [ 'contains', arr, ...rest ] }) as boolean;
}

export function first(state: any): any {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'first', arr ] }) as any;
}

export function last(state: any): any {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'last', arr ] }) as any;
}

export function slice(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ arr ] = args;
    const { start, end } = namedArgs;

    if (isset(end))
        return op({ ...state, args: [ 'slice', arr ], namedArgs: { ...namedArgs, start, end } }) as any[];
    else
        return op({ ...state, args: [ 'slice', arr ], namedArgs: { ...namedArgs, start } }) as any[];
}

export function concat(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ arr, ...rest ] = args;

    return op({ ...state, args: [ 'concat', arr, ...rest ] }) as any[];
}

export function unique(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'unique', arr ] }) as any[];
}

export function check(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'check', arr ] }) as boolean;
}


export default defineModule({
    helpers: {
        op: op,
        string: string,
        destruct: destruct,
        length: length,
        len: length,
        empty: empty,
        reverse: reverse,
        contains: contains,
        slice: slice,
        concat: concat,
        unique: unique,
        check: check,
        __default: op,
    },
});
