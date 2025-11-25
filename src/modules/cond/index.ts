import { Obj } from '@/types';
import { audit, defineModule } from '@/lib';
import { TemplateSyntaxError } from '@/errors';


// Functions

export function op(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const namedArgs: Obj = state?.namedArgs ?? {};
  const [ arg1, arg2OrOp, arg3, ...rest ] = args;
  const { soft } = namedArgs;


  // If the 'not' was passed

  if (arg1 === 'not') return !arg2OrOp;


  // If the 'soft' was passed

  if (soft) {
    switch (arg2OrOp) {
      case 'equal':
        return arg1 == arg3;
      case 'notEqual':
        return arg1 != arg3;
      default:
        throw new TemplateSyntaxError('Condition: Unknown operation: ' + audit(arg2OrOp));
    }
  }


  // Defining the functions

  const and = <T = any>(...a: T[]): T => a.reduce((r, x) => r && x);

  const or  = <T = any>(...a: T[]): T => a.reduce((r, x) => r || x);


  // Matching an operation

  switch (arg2OrOp) {
    case 'equal':
      return arg1 === arg3;
    case 'notEqual':
      return arg1 !== arg3;
    case 'and':
      return and(arg1, arg3, ...rest);
    case 'or':
      return or(arg1, arg3, ...rest);
    case 'greater':
      return Number(arg1) > Number(arg3);
    case 'less':
      return Number(arg1) < Number(arg3);
    default:
      throw new TemplateSyntaxError('Condition: Unknown operation: ' + audit(arg2OrOp));
  }
}

export function not(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a ] = args;

  return op({ ...state, args: [ 'not', a ] });
}

export function equal(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ ...state, args: [ a, 'equal', b ] });
}

export function notEqual(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ ...state, args: [ a, 'notEqual', b ] });
}

export function and(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, ...rest ] = args;

  return op({ ...state, args: [ a, 'and', ...rest ] });
}

export function or(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, ...rest ] = args;

  return op({ ...state, args: [ a, 'or', ...rest ] });
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
    notEqual: notEqual,
    and: and,
    or: or,
    greater: greater,
    less: less,
    noColor: op,
    __default: op,
  },
});
