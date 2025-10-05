import { SafeString } from 'handlebars';
import { audit, defineModule, ensureDate } from '@/lib';
import { putWithColor } from '@/modules/put';


// Constants

export const DEFAULT_LANG = 'en-US';


// Functions

export function op(state: any): string|number {
  const args: any[] = state?.args ?? [];
  const [ date, op, arg ] = args;
  const newDate = ensureDate(date);


  // Defining the functions

  const pad = (val: string|number, pad: number = 2): string => String(val || '').padStart(pad, '0');


  // If the pad was passed

  if (arg === 'pad') {
    switch (op) {
      case 'hour':
        return pad(newDate.getHours());
      case 'minute':
        return pad(newDate.getMinutes());
      case 'day':
        return pad(newDate.getDate());
      case 'month':
        return pad(newDate.getMonth() + 1);
      case 'year':
        return pad(newDate.getFullYear(), 4);
      default:
        throw new Error(`Date: Operation ${audit(op)} is not compatible with argument 'pad'`);
    }
  }


  // Matching an operation

  switch (op) {
    case 'hour':
      return newDate.getHours();
    case 'minute':
      return newDate.getMinutes();
    case 'day':
      return newDate.getDate();
    case 'month':
      return newDate.getMonth() + 1;
    case 'monthText':
      return newDate.toLocaleString(arg ?? DEFAULT_LANG, { month: 'long' });
    case 'year':
      return newDate.getFullYear();
    case 'unix':
      return newDate.getTime();
    case 'iso':
      return newDate.toISOString();
    default:
      throw new Error('Date: Unknown operation: ' + audit(op));
  }
}

export function opWithColor(state: any): SafeString {
  const result = op(state);
  const newState = { ...state, args: [ result ] };

  return putWithColor(newState);
}

export function day(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'day' ] });
  else
    return opWithColor({ args: [ date, 'day', 'pad' ] });
}

export function month(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'month' ] });
  else
    return opWithColor({ args: [ date, 'month', 'pad' ] });
}

export function monthText(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, lang ] = args;

  return opWithColor({ args: [ date, 'monthText', lang ?? DEFAULT_LANG ] });
}

export function year(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'year' ] });
  else
    return opWithColor({ args: [ date, 'year', 'pad' ] });
}

export function unix(state: any): number {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;

  return op({ args: [ date, 'unix' ] }) as number;
}

export function iso(state: any): string {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;

  return op({ args: [ date, 'iso' ] }) as string;
}


export default defineModule({
  helpers: {
    op: op,
    day: day,
    month: month,
    monthText: monthText,
    year: year,
    unix: unix,
    iso: iso,
    noColor: op,
    __default: opWithColor,
  },
});
