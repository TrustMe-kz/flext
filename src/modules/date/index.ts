import { SafeString } from 'handlebars';
import { audit, inarr, ensureDate, defineModule } from '@/lib';
import { BaseError } from '@/errors';
import { putWithColor } from '@/modules/put';


// Constants

export const DEFAULT_LANG = 'en-US';


// Functions

export function op(state: any): Date | string | number {
  const args: any[] = state?.args ?? [];
  const [ date, opOrArg2, genitiveOrArg3, langOrArg4 ] = args;
  const newDate = inarr(date, 'now', null, undefined) ? new Date() : ensureDate(date);


  // Defining the functions

  const pad = (val: string|number, pad: number = 2): string => String(val || '').padStart(pad, '0');


  // If the 'pad' was passed

  if (opOrArg2 === 'pad') {
    switch (genitiveOrArg3) {
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
        throw new BaseError(`Date: Operation ${audit(op)} is not compatible with argument 'pad'`);
    }
  }

  if (genitiveOrArg3 === 'genitive') {
    switch (opOrArg2) {
      case 'monthText':
        const dateText = newDate.toLocaleString(langOrArg4 ?? DEFAULT_LANG, { day: 'numeric', month: 'long' });
        const monthText = dateText.replace(/[^\p{L}]/gu, ''); // TODO: kr: Costyl to work with thw US dates

        return monthText.toLowerCase();
      default:
        throw new BaseError(`Date: Operation ${audit(op)} is not compatible with argument 'genitive'`);
    }
  }


  // Matching an operation

  switch (opOrArg2) {
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
      const monthText = newDate.toLocaleString(genitiveOrArg3 ?? DEFAULT_LANG, { month: 'long' });
      return monthText.toLowerCase();
    case 'year':
      return newDate.getFullYear();
    case 'text':
      return newDate.toLocaleString(genitiveOrArg3 ?? DEFAULT_LANG);
    case 'unix':
      return newDate.getTime();
    case 'iso':
      return newDate.toISOString();
    default:
      return newDate;
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

  if (arg === 'noPadding')
    return opWithColor({ args: [ date, 'seconds' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'seconds' ] });
}

export function minutes(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ args: [ date, 'minutes' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'minutes' ] });
}

export function hours(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ args: [ date, 'hours' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'hours' ] });
}

export function day(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ args: [ date, 'day' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'day' ] });
}

export function month(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ args: [ date, 'month' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'month' ] });
}

export function monthText(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, opOrArg2, genitiveOrArg3 ] = args;

  if (opOrArg2 === 'nominative')
    return opWithColor({ args: [ date, 'monthText', genitiveOrArg3 ?? DEFAULT_LANG ] });
  else
    return opWithColor({ args: [ date, 'monthText', 'genitive', opOrArg2 ?? DEFAULT_LANG ] });
}

export function year(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ args: [ date, 'year' ] });
  else
    return opWithColor({ args: [ date, 'pad', 'year' ] });
}

export function text(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, lang ] = args;

  return opWithColor({ args: [ date, 'text', lang ] });
}

export function now(): Date {
  return op({ args: [ 'now' ] }) as Date;
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
    now: now,
    seconds: seconds,
    minutes: minutes,
    hours: hours,
    day: day,
    month: month,
    monthText: monthText,
    year: year,
    text: text,
    unix: unix,
    iso: iso,
    noColor: op,
    __default: text,
  },
});
