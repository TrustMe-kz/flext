import { Obj } from '@/types';
import { defineModule, audit, isObject } from '@/lib';
import { TemplateSyntaxError } from '@/errors';


// Functions

export function op(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ arg1, arg2, arg3, ...rest ] = args;
    const { soft } = namedArgs;


    // If the 'not' operator was passed

    if (arg1 === 'not') return !arg2;

    // Defining the functions

    const _equal = (val: any, valRef: any): boolean => {
        if (soft && isObject(val) && isObject(valRef))
            return JSON.stringify(val) === JSON.stringify(valRef);
        if (soft)
            return val == valRef;
        else
            return val === valRef;
    };

    const _notEqual = (val: any, ...valRefs: any[]): boolean => {
        for (const valRef of valRefs) {
            if (soft && isObject(val) && isObject(valRef) && JSON.stringify(val) === JSON.stringify(valRef))
                return false;
            if (soft && val == valRef)
                return false;
            else if (val === valRef)
                return false;
        }

        return true;
    };

    const _and = <T = any>(..._args: T[]): T => _args.reduce((r, x) => r && x);

    const _or  = <T = any>(..._args: T[]): T => _args.reduce((r, x) => r || x);


    // Applying the operation

    switch (arg2) {
        case 'equal':
            return _equal(arg1, arg3);
        case 'notEqual':
            return _notEqual(arg1, arg3, ...rest);
        case 'and':
            return _and(arg1, arg3, ...rest);
        case 'or':
            return _or(arg1, arg3, ...rest);
        case 'greater':
            return Number(arg1) > Number(arg3);
        case 'less':
            return Number(arg1) < Number(arg3);
        default:
            throw new TemplateSyntaxError('Condition: Unknown operation: ' + audit(arg2));
    }
}

export function not(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ val ] = args;

    return op({ ...state, args: [ 'not', val ] });
}

export function equal(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'equal', b ] });
}

export function notEqual(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b, ...rest ] = args;

    return op({ ...state, args: [ a, 'notEqual', b, ...rest ] });
}

export function and(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ val, ...rest ] = args;

    return op({ ...state, args: [ val, 'and', ...rest ] });
}

export function or(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ val, ...rest ] = args;

    return op({ ...state, args: [ val, 'or', ...rest ] });
}

export function greater(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'greater', b ] });
}

export function less(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'less', b ] });
}


export default defineModule({
    helpers: {
        op: op,
        not: not,
        equal: equal,
        eq: equal,
        notEqual: notEqual,
        notEq: notEqual,
        and: and,
        or: or,
        greater: greater,
        less: less,
        __default: op,
    },
});
