import { Obj } from '@/types';
import { defineModule, isset } from '@/lib';


// Functions

export function op(state: any): any[] | boolean | null {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ op, arr, arg, ...rest ] = args;
    const { strict = false, all = false, start, end } = namedArgs;


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
            else if (arr?.some(i => JSON.stringify(i) !== JSON.stringify(valRef)))
                return false;
        }

        return true;
    };


    // Applying the operation

    switch (op) {
        case 'destruct':
            return destruct(arr, arg);
        case 'length':
            return arr?.length ?? null;
        case 'reverse':
            return reverse(arr);
        case 'slice':
            return isset(end) ? arr.slice(start, end) : arr.slice(start);
        case 'contains':
            return all ? containsAll(arg, ...rest) : _contains(arg, ...rest);
        case 'check':
            return Array.isArray(arr);
        default:
            return op;
    }
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

export function reverse(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'reverse', arr ] }) as any[];
}

export function slice(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ arr ] = args;
    const { start, end } = namedArgs;

    if (end)
        return op({ ...state, args: [ 'slice', arr ], namedArgs: { ...namedArgs, start, end } }) as any[];
    else
        return op({ ...state, args: [ 'slice', arr ], namedArgs: { ...namedArgs, start } }) as any[];
}

export function contains(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ arr, ...rest ] = args;

    return op({ ...state, args: [ 'contains', arr, ...rest ] }) as boolean;
}

export function check(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'check', arr ] }) as boolean;
}


export default defineModule({
    helpers: {
        op: op,
        destruct: destruct,
        length: length,
        len: length,
        reverse: reverse,
        slice: slice,
        contains: contains,
        check: check,
        __default: op,
    },
});
