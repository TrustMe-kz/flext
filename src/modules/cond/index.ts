import { Obj } from '@/types';
import { audit, defineModule } from '@/lib';
import { BaseError } from '@/errors';


// Functions

export function op(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const namedArgs: Obj = state?.namedArgs ?? {};
  const [ a, op, b ] = args;
  const { soft } = namedArgs;


  // If the 'soft' was passed

  if (soft) {
    switch (op) {
      case 'equal':
        return a == b;
      case 'notEqual':
        return a != b;
      default:
        throw new BaseError('Condition: Unknown operation: ' + audit(op));
    }
  }


  // Matching an operation

  switch (op) {
    case 'equal':
      return a === b;
    case 'notEqual':
      return a !== b;
    case 'and':
      return a && b;
    case 'or':
      return a || b;
    case 'greater':
      return Number(a) > Number(b);
    case 'less':
      return Number(a) < Number(b);
    default:
      throw new BaseError('Condition: Unknown operation: ' + audit(op));
  }
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
  const [ a, b ] = args;

  return op({ ...state, args: [ a, 'and', b ] });
}

export function or(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ ...state, args: [ a, 'or', b ] });
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
