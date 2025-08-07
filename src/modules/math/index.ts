import { SafeString } from 'handlebars';
import { defineModule, audit } from '@/lib';
import { putWithColor } from '../put';
import Math from 'math';


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
      throw new Error('Math: Unknown operation: ' + audit(mathOp));
  }


  // Guessing the operation

  switch (op) {
    case 'plus':
      return a + b;
    case 'minus':
      return a - b;
    case 'multiply':
      return a * b;
    case 'divide':
      return a / b;
    case 'intDivide':
      return a % b;
    case 'power':
      return a ** b;
    default:
      return calc(...args);
  }
}

export function opWithColor(state: any): SafeString {
  const result = op(state);
  const newState = { args: [ result ] };

  return putWithColor(newState);
}

export function plus(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ args: [ a, 'plus', b ] });
}

export function minus(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ args: [ a, 'minus', b ] });
}

export function multiply(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ args: [ a, 'multiply', b ] });
}

export function divide(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ args: [ a, 'divide', b ] });
}

export function intDivide(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ args: [ a, 'intDivide', b ] });
}

export function power(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, b ] = args;

  return opWithColor({ args: [ a, 'power', b ] });
}

export function round(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a, op ] = args;


  // Defining the function

  const handle = (op: string, val: Arg): SafeString => opWithColor({ args: [ 'round', val ] });


  // If the operation is not defined

  if (!op) return handle('round', a);


  // Guessing the operation

  switch (op) {
    case 'floor':
      return handle('floor', a);
    case 'ceil':
      return handle('ceil', a);
    case 'trunc':
      return handle('trunc', a);
    default:
      throw new Error('Math: Unknown operation: ' + audit(op));
  }
}

export function percent(state: any): SafeString {
    const args: Arg[] = state?.args ?? [];
    const [ a, b ] = args;

    if (b === undefined || b === null) {
        return opWithColor({ args: [ 'percent', a ] });
    } else {
        return opWithColor({ args: [ a, 'divide', b, 'multiply', 100 ] });
    }
}

export function sqrt(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a ] = args;

  return opWithColor({ args: [ 'sqrt', a ] });
}

export function cbrt(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a ] = args;

  return opWithColor({ args: [ 'cbrt', a ] });
}

export function abs(state: any): SafeString {
  const args: Arg[] = state?.args ?? [];
  const [ a ] = args;

  return opWithColor({ args: [ 'abs', a ] });
}


export default defineModule({
  helpers: {
    op: opWithColor,
    plus: plus,
    minus: minus,
    multiply: multiply,
    divide: divide,
    intDivide: intDivide,
    power: power,
    round: round,
    sqrt: sqrt,
    cbrt: cbrt,
    abs: abs,
    noColor: op,
    default: opWithColor,
  },
});
