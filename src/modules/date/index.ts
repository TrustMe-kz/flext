import { DateTime } from 'luxon';
import { SafeString } from 'handlebars';
import { Obj } from '@/types';
import { audit, inarr, ensureDate, defineModule } from '@/lib';
import { BaseError } from '@/errors';
import { putWithColor } from '@/modules/put';


// Constants

export const DEFAULT_LANG = 'en-US';


// Functions

export function op(state: any): DateTime | string | number {
  const flext: Obj = state?.flext ?? {};
  const args: any[] = state?.args ?? [];
  const [ date, opOrArg2, genitiveOrArg3, langOrArg4 ] = args;


  // Defining the functions

  const pad = (val: string|number, pad: number = 2): string => String(val || '').padStart(pad, '0');


  // Getting the date

  let newDate: DateTime = DateTime.local();

  if (!inarr(date, 'now', null, undefined))
    newDate = DateTime.fromJSDate(ensureDate(date));

  if (flext?.timeZone)
    newDate = newDate.setZone(flext?.timeZone);


  // If the 'pad' was passed

  if (opOrArg2 === 'pad') {
    switch (genitiveOrArg3) {
      case 'seconds':
        return pad(newDate.second);
      case 'minutes':
        return pad(newDate.minute);
      case 'hours':
        return pad(newDate.hour);
      case 'day':
        return pad(newDate.day);
      case 'month':
        return pad(newDate.month);
      case 'year':
        return pad(newDate.year, 4);
      default:
        throw new BaseError(`Date: Operation ${audit(op)} is not compatible with argument 'pad'`);
    }
  }

  if (genitiveOrArg3 === 'genitive') {
    switch (opOrArg2) {
      case 'monthText':
        const dateText = newDate.setLocale(langOrArg4 ?? DEFAULT_LANG).toLocaleString({ day: 'numeric', month: 'long' });
        const monthText = dateText.replace(/[^\p{L}]/gu, ''); // TODO: kr: Costyl to work with thw US dates

        return monthText.toLowerCase();
      default:
        throw new BaseError(`Date: Operation ${audit(op)} is not compatible with argument 'genitive'`);
    }
  }


  // Matching an operation

  switch (opOrArg2) {
    case 'seconds':
      return newDate.second;
    case 'minutes':
      return newDate.minute;
    case 'hours':
      return newDate.hour;
    case 'day':
      return newDate.day;
    case 'month':
      return newDate.month;
    case 'monthText':
      const monthText = newDate.setLocale(genitiveOrArg3 ?? DEFAULT_LANG).toLocaleString({ month: 'long' });
      return monthText.toLowerCase();
    case 'year':
      return newDate.year;
    case 'text':
      return newDate.setLocale(genitiveOrArg3 ?? DEFAULT_LANG).toLocaleString();
    case 'unix':
      return newDate.toMillis();
    case 'iso':
      return newDate.toISOTime();
    default:
      return newDate;
  }
}

export function opWithColor(state: any): SafeString {
  const result = op(state);
  const newState = { ...state, args: [ result ] };

  return putWithColor(newState);
}

export function now(state: any): DateTime {
  return op({ ...state, args: [ 'now' ] }) as DateTime;
}

export function seconds(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ ...state, args: [ date, 'seconds' ] });
  else
    return opWithColor({ ...state, args: [ date, 'pad', 'seconds' ] });
}

export function minutes(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ ...state, args: [ date, 'minutes' ] });
  else
    return opWithColor({ ...state, args: [ date, 'pad', 'minutes' ] });
}

export function hours(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ ...state, args: [ date, 'hours' ] });
  else
    return opWithColor({ ...state, args: [ date, 'pad', 'hours' ] });
}

export function day(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ ...state, args: [ date, 'day' ] });
  else
    return opWithColor({ ...state, args: [ date, 'pad', 'day' ] });
}

export function month(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ ...state, args: [ date, 'month' ] });
  else
    return opWithColor({ ...state, args: [ date, 'pad', 'month' ] });
}

export function monthText(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, opOrArg2, genitiveOrArg3 ] = args;

  if (opOrArg2 === 'nominative')
    return opWithColor({ ...state, args: [ date, 'monthText', genitiveOrArg3 ?? DEFAULT_LANG ] });
  else
    return opWithColor({ ...state, args: [ date, 'monthText', 'genitive', opOrArg2 ?? DEFAULT_LANG ] });
}

export function year(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, arg ] = args;

  if (arg === 'noPadding')
    return opWithColor({ ...state, args: [ date, 'year' ] });
  else
    return opWithColor({ ...state, args: [ date, 'pad', 'year' ] });
}

export function text(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date, lang ] = args;

  return opWithColor({ ...state, args: [ date, 'text', lang ] });
}

export function unix(state: any): number {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;

  return op({ ...state, args: [ date, 'unix' ] }) as number;
}

export function iso(state: any): string {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;

  return op({ ...state, args: [ date, 'iso' ] }) as string;
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
    __default: opWithColor,
  },
});
