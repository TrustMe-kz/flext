import { SafeString } from 'handlebars';
import { defineModule, audit } from '@/lib';
import { TemplateSyntaxError } from '@/errors';
import { putWithColor } from '../put';


// Types

export type Arg = string|number|null|undefined;


// Functions

export function op(state: any): number {
  const args: Arg[] = state?.args ?? [];
  const [ a, op, b ] = args;


  // Defining the functions

  const calc = (...args1: Arg[]): number => {
    const [ mathOp, ...mathArgs ] = args1;
    const handle = Math[mathOp] ?? null;

    if (handle)
      return handle(...mathArgs);
    else
      throw new TemplateSyntaxError('Math: Unknown operation: ' + audit(mathOp));
  }


  // Matching an operation

  switch (op) {
    case 'plus':
      return Number(a) + Number(b);
    case 'minus':
      return Number(a) - Number(b);
    case 'multiply':
      return Number(a) * Number(b);
    case 'divide':
      return Number(a) / Number(b);
    case 'intDivide':
      return Number(a) % Number(b);
    case 'power':
      return Number(a) ** Number(b);
    default:
      return calc(...args);
  }
}

export function opWithColor(state: any): SafeString {
  const result = op(state);
  return putWithColor({ ...state, args: [ result ] });
}

export function plus(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ ...state, args: [ a, 'plus', b ] });
}

export function minus(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ ...state, args: [ a, 'minus', b ] });
}

export function multiply(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ ...state, args: [ a, 'multiply', b ] });
}

export function divide(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ ...state, args: [ a, 'divide', b ] });
}

export function intDivide(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ ...state, args: [ a, 'intDivide', b ] });
}

export function power(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ ...state, args: [ a, 'power', b ] });
}

export function round(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, op ] = args;


  // Defining the function

  const handle = (op: string, val: Arg): SafeString => opWithColor({ ...state, args: [ op, val ] });


  // If the operation is not defined

  if (!op) return handle('round', a);


  // Matching an operation

  switch (op) {
    case 'floor':
      return handle('floor', a);
    case 'ceil':
      return handle('ceil', a);
    case 'trunc':
      return handle('trunc', a);
    default:
      throw new TemplateSyntaxError('Math: Unknown operation: ' + audit(op));
  }
}

export function percent(state: any): SafeString {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    if (b === undefined || b === null) {
        return opWithColor({ ...state, args: [ 'percent', a ] });
    } else {
        return opWithColor({ ...state, args: [ a, 'divide', b, 'multiply', 100 ] });
    }
}

export function sqrt(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a ] = args;

  return opWithColor({ ...state, args: [ 'sqrt', a ] });
}

export function cbrt(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a ] = args;

  return opWithColor({ ...state, args: [ 'cbrt', a ] });
}

export function abs(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a ] = args;

  return opWithColor({ ...state, args: [ 'abs', a ] });
}


export default defineModule({
  helpers: {
    op: opWithColor,
    plus: plus,
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
    noColor: op,
    __default: opWithColor,
  },
});
