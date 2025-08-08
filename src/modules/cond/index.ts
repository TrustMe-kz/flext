// import { SafeString } from 'handlebars';
import { audit, defineModule } from '@/lib';
// import { putWithColor } from '@/modules/put';


// Functions

export function op(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, op, b ] = args;


  // Defining the functions

  const handle = (...args1: any[]): boolean => {
    const [ newOp, ...newArgs ] = args1;
    const [ _arg ] = newArgs;

    switch (newOp) {
      // case 'not':
      //   return !_arg;
      default:
        throw new Error('Condition: Unknown operation: ' + audit(newOp));
    }
  }


  // Guessing the operation

  switch (op) {
    case 'equal':
      return a === b;
    case 'softEqual':
      return a == b;
    case 'notEqual':
      return a !== b;
    case 'softNotEqual':
      return a != b;
    case 'and':
      return a && b;
    case 'or':
      return a || b;
    case 'greater':
      return Number(a) > Number(b);
    case 'less':
      return Number(a) < Number(b);
    default:
      return handle(...args);
  }
}

// export function opWithColor(state: any): SafeString {
//   const result = op(state);
//   const newState = { ...state, args: [ result ] };
//
//   return putWithColor(newState);
// }

export function equal(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'equal', b ] });
}

export function softEqual(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'softEqual', b ] });
}

export function notEqual(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'notEqual', b ] });
}

export function softNotEqual(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'softNotEqual', b ] });
}

export function and(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'and', b ] });
}

export function or(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'or', b ] });
}

export function greater(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'greater', b ] });
}

export function less(state: any): boolean {
  const args: any[] = state?.args ?? [];
  const [ a, b ] = args;

  return op({ args: [ a, 'less', b ] });
}


export default defineModule({
  helpers: {
    op: op,
    equal: equal,
    softEqual: softEqual,
    notEqual: notEqual,
    softNotEqual: softNotEqual,
    and: and,
    or: or,
    greater: greater,
    less: less,
    noColor: op,
    __default: op,
  },
});
