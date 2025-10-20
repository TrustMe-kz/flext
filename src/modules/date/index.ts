import { DateTime } from 'luxon';
import { SafeString } from 'handlebars';
import { Obj } from '@/types';
import { audit, inarr, ensureDate, defineModule } from '@/lib';
import { BaseError } from '@/errors';
import { putWithColor } from '@/modules/put';


// Functions

export function op(state: any): DateTime | string | number {
  const flext: Obj = state?.flext ?? {};
  const args: any[] = state?.args ?? [];
  const namedArgs: Obj = state?.namedArgs ?? {};
  const [ date, opName ] = args;
  const { padding, genitive, timeZone, lang } = namedArgs;


  // Defining the functions

  const padStart = (val: string|number, pad: number = 2): string => String(val || '').padStart(pad, '0');


  // Getting the date

  let newDate: DateTime = DateTime.local();

  if (!inarr(date, 'now', null, undefined))
    newDate = DateTime.fromJSDate(ensureDate(date));

  if (timeZone || flext?.timeZone)
    newDate = newDate.setZone(timeZone ?? flext?.timeZone);

  if (lang || flext?.lang)
    newDate = newDate.setLocale(lang ?? flext?.lang);


  // If the 'pad' was passed

  if (padding) {
    switch (opName) {
      case 'seconds':
        return padStart(newDate.second, padding);
      case 'minutes':
        return padStart(newDate.minute, padding);
      case 'hours':
        return padStart(newDate.hour, padding);
      case 'day':
        return padStart(newDate.day, padding);
      case 'month':
        return padStart(newDate.month, padding);
      case 'year':
        return padStart(newDate.year, 4);
      default:
        throw new BaseError(`Date: Operation ${audit(op)} is not compatible with argument 'pad'`);
    }
  }

  if (genitive) {
    switch (opName) {
      case 'monthText':
        const dateText = newDate.toLocaleString({ day: 'numeric', month: 'long' });
        const monthText = dateText.replace(/[^\p{L}]/gu, ''); // TODO: kr: Costyl to work with thw US dates

        return monthText.toLowerCase();
      default:
        throw new BaseError(`Date: Operation ${audit(op)} is not compatible with argument 'genitive'`);
    }
  }


  // Matching an operation

  switch (opName) {
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
      const monthText = newDate.toLocaleString({ month: 'long' });
      return monthText.toLowerCase();
    case 'year':
      return newDate.year;
    case 'text':
      return newDate.toLocaleString();
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
  return putWithColor({ ...state, args: [ result ] });
}

export function now(state: any): DateTime {
  return op({ ...state, args: [ 'now' ] }) as DateTime;
}

export function seconds(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;
  const namedArgs: Obj = state?.namedArgs ?? {};
  const padding = namedArgs?.padding ?? 2;

  return opWithColor({
    ...state,

    args: [ date, 'seconds' ],
    namedArgs: { ...namedArgs, padding },
  });
}

export function minutes(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;
  const namedArgs: Obj = state?.namedArgs ?? {};
  const padding = namedArgs?.padding ?? 2;

  return opWithColor({
    ...state,

    args: [ date, 'minutes' ],
    namedArgs: { ...namedArgs, padding },
  });
}

export function hours(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;
  const namedArgs: Obj = state?.namedArgs ?? {};
  const padding = namedArgs?.padding ?? 2;

  return opWithColor({
    ...state,

    args: [ date, 'hours' ],
    namedArgs: { ...namedArgs, padding },
  });
}

export function day(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;
  const namedArgs: Obj = state?.namedArgs ?? {};
  const padding = namedArgs?.padding ?? 2;

  return opWithColor({
    ...state,

    args: [ date, 'day' ],
    namedArgs: { ...namedArgs, padding },
  });
}

export function month(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;
  const namedArgs: Obj = state?.namedArgs ?? {};
  const padding = namedArgs?.padding ?? 2;

  return opWithColor({
    ...state,

    args: [ date, 'month' ],
    namedArgs: { ...namedArgs, padding },
  });
}

export function monthText(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;
  const namedArgs: Obj = state?.namedArgs ?? {};
  const genitive = !namedArgs?.nominative;

  return opWithColor({
    ...state,

    args: [ date, 'monthText' ],
    namedArgs: { ...namedArgs, genitive },
  });
}

export function year(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;
  const namedArgs: Obj = state?.namedArgs ?? {};
  const padding = namedArgs?.padding ?? 2;

  return opWithColor({
    ...state,

    args: [ date, 'year' ],
    namedArgs: { ...namedArgs, padding },
  });
}

export function text(state: any): SafeString {
  const args: any[] = state?.args ?? [];
  const [ date ] = args;

  return opWithColor({ ...state, args: [ date, 'text' ] });
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
