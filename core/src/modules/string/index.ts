import { Obj } from '@/types';
import { defineModule, isset } from '@/lib';


// Functions

export function op(state: any): Obj | any[] | string | boolean {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ op, str, arg, ...rest ] = args;
    const { strict = true, start, end } = namedArgs;


    // Defining the functions

    const contains = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (strict && str?.indexOf(valRef) >= 0)
                return true;
            else if (str?.toLowerCase()?.indexOf(valRef?.toLowerCase()) >= 0)
                return true;
        }

        return false;
    };

    const starts = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (strict && str?.startsWith(valRef))
                return true;
            else if (str?.toLowerCase()?.startsWith(valRef?.toLowerCase()))
                return true;
        }

        return false;
    };

    const ends = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (strict && str?.endsWith(valRef))
                return true;
            else if (str?.toLowerCase()?.endsWith(valRef?.toLowerCase()))
                return true;
        }

        return false;
    };


    // Applying the operation

    switch (op) {
        case 'json':
            return JSON.parse(str);
        case 'trim':
            return str.trim();
        case 'slice':
            return isset(end) ? str.slice(start, end) : str.slice(start);
        case 'contains':
            return contains(arg, ...rest);
        case 'starts':
            return starts(arg, ...rest);
        case 'ends':
            return ends(arg, ...rest);
        case 'check':
            return typeof str === 'string';
        default:
            return op;
    }
}

export function json(state: any): Obj | any[] {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'json', str ] }) as Obj | any[];
}

export function trim(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'trim', str ] }) as string;
}

export function slice(state: any): string {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ str ] = args;
    const { start, end } = namedArgs;

    if (end)
        return op({ ...state, args: [ 'slice', str ], namedArgs: { ...namedArgs, start, end } }) as string;
    else
        return op({ ...state, args: [ 'slice', str ], namedArgs: { ...namedArgs, start } }) as string;
}

export function contains(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ str, ...rest ] = args;

    return op({ ...state, args: [ 'contains', str, ...rest ] }) as boolean;
}

export function starts(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ str, ...rest ] = args;

    return op({ ...state, args: [ 'starts', str, ...rest ] }) as boolean;
}

export function ends(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ str, ...rest ] = args;

    return op({ ...state, args: [ 'ends', str, ...rest ] }) as boolean;
}

export function check(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'check', str ] }) as boolean;
}


export default defineModule({
    helpers: {
        op: op,
        json: json,
        trim: trim,
        slice: slice,
        contains: contains,
        starts: starts,
        ends: ends,
        check: check,
        __default: op,
    },
});
