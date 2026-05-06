import { DateTime } from 'luxon';
import { Obj } from '@/types';
import { defineModule, audit, isNumber, isObject } from '@/lib';
import { TemplateError, TemplateSyntaxError } from '@/errors';


// Functions

export function op(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ arg1, arg2, arg3, ...rest ] = args;
    const { soft, inclusive } = namedArgs;


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

    const _greater = <T = number | DateTime>(val: T, valRef: T, _inclusive: boolean = false): boolean => {
        if (isNumber(val) && _inclusive)
            return Number(val) >= Number(valRef);
        if (isNumber(val))
            return Number(val) > Number(valRef);
        else if (isObject(val) && val instanceof DateTime && _inclusive)
            return val >= valRef;
        else if (isObject(val) && val instanceof DateTime)
            return val > valRef;
        else
            throw new TemplateError(`Condition: Unable to perform '${arg2}': Unsupported type: ${audit(typeof arg1)}`);
    };

    const _less = <T = number | DateTime>(val: T, valRef: T, _inclusive: boolean = false): boolean => {
        return !_greater(val, valRef, !_inclusive);
    };

    const _between = <T = number | DateTime>(val: T, valRef1: T, valRef2: T, _inclusive: boolean = false): boolean => {
        return _greater(val, valRef1, _inclusive) && _less(val, valRef2, _inclusive);
    };


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
            return _greater(arg1, arg3);
        case 'greaterOrEqual':
            return _greater(arg1, arg3, true);
        case 'less':
            return _less(arg1, arg3);
        case 'lessOrEqual':
            return _less(arg1, arg3, true);
        case 'between':
            const [ arg4 ] = rest;
            return _between(arg1, arg3, arg4, inclusive);
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

export function greaterOrEqual(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'greaterOrEqual', b ] });
}

export function less(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'less', b ] });
}

export function lessOrEqual(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'lessOrEqual', b ] });
}

export function between(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ a, b, c ] = args;

    return op({ ...state, args: [ a, 'between', b, c ] });
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
        greaterOrEqual: greaterOrEqual,
        greaterOrEq: greaterOrEqual,
        less: less,
        lessOrEqual: lessOrEqual,
        lessOrEq: lessOrEqual,
        between: between,
        __default: op,
    },
});
