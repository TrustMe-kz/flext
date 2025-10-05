import { SafeString } from 'handlebars';
import { audit, defineModule, ensureDate } from '@/lib';
import { putWithColor } from '@/modules/put';


// Constants

export const DEFAULT_LANG = 'en-US';


// Functions

export function op(state: any): string|number {
  const args: any[] = state?.args ?? [];
  const [ date, arg1, arg2, arg3 ] = args;
  const newDate = ensureDate(date);


  // Defining the functions

  const pad = (val: string|number, pad: number = 2): string => String(val || '').padStart(pad, '0');


  // If the pad was passed

  if (arg1 === 'pad') {
    switch (arg2) {
      case 'seconds':
        return pad(newDate.getSeconds());
      case 'minutes':
        return pad(newDate.getMinutes());
      case 'hours':
        return pad(newDate.getHours());
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

  if (arg2 === 'genitive') {
    switch (arg1) {
      case 'monthText':
        const dateText = newDate.toLocaleString(arg3 ?? DEFAULT_LANG, { day: 'numeric', month: 'long' });
        const monthText = dateText.replace(/[^\p{L}]/gu, '');

        return monthText.toLowerCase();
      default:
        throw new Error(`Date: Operation ${audit(op)} is not compatible with argument 'genitive'`);
    }
  }


  // Matching an operation

  switch (arg1) {
    case 'seconds':
      return newDate.getSeconds();
    case 'minutes':
      return newDate.getMinutes();
    case 'hours':
      return newDate.getHours();
    case 'day':
      return newDate.getDate();
    case 'month':
      return newDate.getMonth() + 1;
    case 'monthText':
      const monthText = newDate.toLocaleString(arg2 ?? DEFAULT_LANG, { month: 'long' });
      return monthText.toLowerCase();
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

export function seconds(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'seconds' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'seconds' ] });
}

export function minutes(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'minutes' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'minutes' ] });
}

export function hours(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'hours' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'hours' ] });
}

export function day(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'day' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'day' ] });
}

export function month(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'month' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'month' ] });
}

export function monthText(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg1, arg2 ] = args;

  if (arg1 === 'nominative')
    return opWithColor({ args: [ date, 'monthText', arg2 ?? DEFAULT_LANG ] });
  else
    return opWithColor({ args: [ date, 'monthText', 'genitive', arg1 ?? DEFAULT_LANG ] });
}

export function year(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPad')
    return opWithColor({ args: [ date, 'year' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'year' ] });
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
    op: opWithColor,
    seconds: seconds,
    minutes: minutes,
    hours: hours,
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
