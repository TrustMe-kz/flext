import { Obj } from '@/types';
import { defineModule, isset, RegexHelper } from '@/lib';


// Functions

export function op(state: any): Obj | any[] | string | boolean {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ op = 'default', str, arg, ...rest ] = args;
    const { separator = '', soft, start, end } = namedArgs;


    // Doing some checks

    if (op === 'check')
        return typeof str === 'string';

    if (op === 'default')
        return String(str);


    // Defining the functions

    const title = (val: string): string => val
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const capitalize = (val: string): string => val.replace(RegexHelper.firstChars, c => c.toUpperCase());

    const _contains = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (soft && str?.toLowerCase()?.indexOf(valRef?.toLowerCase()) >= 0)
                return true;
            else if (str?.indexOf(valRef) >= 0)
                return true;
        }

        return false;
    };

    const starts = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (soft && str?.toLowerCase()?.startsWith(valRef?.toLowerCase()))
                return true;
            else if (str?.startsWith(valRef))
                return true;
        }

        return false;
    };

    const ends = (...refs: string[]): boolean => {
        for (const valRef of refs) {
            if (soft && str?.toLowerCase()?.endsWith(valRef?.toLowerCase()))
                return true;
            else if (str?.endsWith(valRef))
                return true;
        }

        return false;
    };


    // Applying the operation

    switch (op) {
        case 'array':
            return str.split(separator);
        case 'json':
            return JSON.parse(str);
        case 'trim':
            return str.trim();
        case 'lower':
            return str.toLowerCase();
        case 'upper':
            return str.toUpperCase();
        case 'title':
            return title(str);
        case 'capitalize':
            return capitalize(str);
        case 'slice':
            return isset(end) ? str.slice(start, end) : str.slice(start);
        case 'contains':
            return _contains(arg, ...rest);
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

export function array(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'array', str ] }) as any[];
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

export function lower(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'lower', str ] }) as string;
}

export function upper(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'upper', str ] }) as string;
}

export function title(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'title', str ] }) as string;
}

export function capitalize(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'capitalize', str ] }) as string;
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
        array: array,
        json: json,
        trim: trim,
        lower: lower,
        upper: upper,
        title: title,
        capitalize: capitalize,
        name: capitalize,
        slice: slice,
        contains: contains,
        starts: starts,
        ends: ends,
        check: check,
        __default: op,
    },
});
