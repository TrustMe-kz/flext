import { DateTime } from 'luxon';
import { Obj } from '@/types';
import { audit, ensureDate, defineModule, isset } from '@/lib';
import { TemplateSyntaxError } from '@/errors';


// Functions

export function op(state: any): DateTime | string | number | null {
    const flext: Obj = state?.flext ?? {};
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ date, op ] = args;
    const { padding, genitive, timeZone, lang } = namedArgs;


    // Doing some checks

    if (!date) return null;


    // Getting the date

    let newDate: DateTime = DateTime.local();

    if (date !== 'now')
        newDate = DateTime.fromJSDate(ensureDate(date));

    if (timeZone || flext?.timeZone)
        newDate = newDate.setZone(timeZone ?? flext?.timeZone);

    if (lang || flext?.lang)
        newDate = newDate.setLocale(lang ?? flext?.lang);


    // Defining the functions

    const padStart = (val: string|number, _padding: string|number = 2): string => String(val || '').padStart(Number(_padding), '0');


    // If the 'pad' was passed

    if (isset(padding)) {
        switch (op) {
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
                throw new TemplateSyntaxError(`Date: Operation ${audit(op)} is not compatible with argument 'padding'`);
        }
    }

    if (genitive) {
        switch (op) {
            case 'monthText':
                const dateText = newDate.toLocaleString({ day: 'numeric', month: 'long' });
                const monthText = dateText.replace(/[^\p{L}]/gu, ''); // TODO: kr: Costyl to work with thw US dates

                return monthText.toLowerCase();
            default:
                throw new TemplateSyntaxError(`Date: Operation ${audit(op)} is not compatible with argument 'genitive'`);
        }
    }


    // Applying the operation

    switch (op) {
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
        case 'format':
            return newDate.toLocaleString();
        case 'text':
            return newDate.toLocaleString({ day: 'numeric', month: 'long', year: 'numeric' });
        case 'unix':
            return newDate.toMillis();
        case 'iso':
            return newDate.toISOTime();
        default:
            return newDate;
    }
}

export function now(state: any): DateTime {
    return op({ ...state, args: [ 'now' ] }) as DateTime;
}

export function seconds(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};
    const padding = namedArgs?.padding ?? 2;

    return op({
        ...state,

        args: [ date, 'seconds' ],
        namedArgs: { ...namedArgs, padding },
    });
}

export function minutes(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};
    const padding = namedArgs?.padding ?? 2;

    return op({
        ...state,

        args: [ date, 'minutes' ],
        namedArgs: { ...namedArgs, padding },
    });
}

export function hours(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};
    const padding = namedArgs?.padding ?? 2;

    return op({
        ...state,

        args: [ date, 'hours' ],
        namedArgs: { ...namedArgs, padding },
    });
}

export function day(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};
    const padding = namedArgs?.padding ?? 2;

    return op({
        ...state,

        args: [ date, 'day' ],
        namedArgs: { ...namedArgs, padding },
    });
}

export function month(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};
    const padding = namedArgs?.padding ?? 2;

    return op({
        ...state,

        args: [ date, 'month' ],
        namedArgs: { ...namedArgs, padding },
    });
}

export function monthText(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};
    const genitive = !namedArgs?.nominative;

    return op({
        ...state,

        args: [ date, 'monthText' ],
        namedArgs: { ...namedArgs, genitive },
    });
}

export function year(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};
    const padding = namedArgs?.padding ?? 2;

    return op({
        ...state,

        args: [ date, 'year' ],
        namedArgs: { ...namedArgs, padding },
    });
}

export function format(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;

    return op({ ...state, args: [ date, 'format' ] });
}

export function text(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;

    return op({ ...state, args: [ date, 'text' ] });
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
        op: op,
        now: now,
        seconds: seconds,
        minutes: minutes,
        hours: hours,
        day: day,
        month: month,
        monthText: monthText,
        year: year,
        format: format,
        text: text,
        unix: unix,
        iso: iso,
        __default: op,
    },
});
