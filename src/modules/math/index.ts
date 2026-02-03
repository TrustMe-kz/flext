import {audit, sum, defineModule, isNumber} from '@/lib';
import {BaseError, TemplateSyntaxError} from '@/errors';


// Types

export type Arg = string|number|null|undefined;

export type FlattenFuncArg = number | number[];


// Functions

export function op(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, op, b, ...rest ] = args;


    // Defining the functions

    const handle = (..._args: Arg[]): number => {
        const [ mathOp, ...mathArgs ] = _args;
        const handle = Math[mathOp] ?? null;

        if (handle)
            return handle(...mathArgs);
        else
            throw new TemplateSyntaxError('Math: Unknown operation: ' + audit(mathOp));
    }

    const flatten = (..._args: FlattenFuncArg[] | any[]): number[] => {
        const result: number[] = [];

        for (const arg of _args) {
            if (isNumber(arg))
                result.push(arg);
            else if (Array.isArray(arg) && arg.every(isNumber))
                result.push(...arg);
            else
                throw new BaseError('Math: Unable to sum: The given arguments are not numbers: ' + audit(_args));
        }

        return result;
    };


    // Applying the operation

    switch (op) {
        case 'plus':
        case 'sum':
            return sum(...flatten(a, b || 0, ...rest));
        case 'minus':
            return Number(a) - Number(b || 0);
        case 'multiply':
            return Number(a) * Number(b || 1);
        case 'divide':
            return Number(a) / Number(b || 1);
        case 'intDivide':
            return Number(a) % Number(b || 1);
        case 'power':
            return Number(a) ** Number(b || 1);
        default:
            return handle(...args);
    }
}

export function plus(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b, ...rest ] = args;

    return op({ ...state, args: [ a, 'plus', b, ...rest ] });
}

export function _sum(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b, ...rest ] = args;

    return op({ ...state, args: [ a, 'sum', b, ...rest ] });
}

export function minus(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'minus', b ] });
}

export function multiply(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'multiply', b ] });
}

export function divide(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'divide', b ] });
}

export function intDivide(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'intDivide', b ] });
}

export function power(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    return op({ ...state, args: [ a, 'power', b ] });
}

export function round(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, _op ] = args;


    // Defining the function

    const handle = (__op: string, val: Arg): number => op({ ...state, args: [ __op, val ] });


    // If the operation is not defined

    if (!_op) return handle('round', a);


    // Applying the operation

    switch (_op) {
        case 'floor':
            return handle('floor', a);
        case 'ceil':
            return handle('ceil', a);
        case 'trunc':
            return handle('trunc', a);
        default:
            throw new TemplateSyntaxError('Math: Unknown operation: ' + audit(_op));
    }
}

export function percent(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    if (b === undefined || b === null) {
        return op({ ...state, args: [ 'percent', a ] });
    } else {
        return op({ ...state, args: [ a, 'divide', b, 'multiply', 100 ] });
    }
}

export function sqrt(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a ] = args;

    return op({ ...state, args: [ 'sqrt', a ] });
}

export function cbrt(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a ] = args;

    return op({ ...state, args: [ 'cbrt', a ] });
}

export function abs(state: any): number {
    const args: Arg[] = state?.args ?? [];
    const [ a ] = args;

    return op({ ...state, args: [ 'abs', a ] });
}


export default defineModule({
    helpers: {
        op: op,
        plus: plus,
        sum: _sum,
        minus: minus,
        mul: multiply,
        multiply: multiply,
        div: divide,
        divide: divide,
        intDivide: intDivide,
        pow: power,
        power: power,
        round: round,
        sqrt: sqrt,
        cbrt: cbrt,
        abs: abs,
        __default: op,
    },
});
