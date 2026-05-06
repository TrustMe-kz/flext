import { DateTime } from 'luxon';
import { Obj } from '@/types';
import { audit, ensureDate, defineModule, isset } from '@/lib';
import { TemplateSyntaxError } from '@/errors';


// Functions

export function op(state: any): DateTime | string | number | null {
    const flext: Obj = state?.flext ?? {};
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ date, op, arg, units ] = args;
    const { padding, genitive, dayFormat, monthFormat, yearFormat, weekdayFormat, hoursFormat, minutesFormat, secondsFormat, timeZoneFormat, hours12, timeZone, lang } = namedArgs;


    // Doing some checks

    if (!date) return null;


    // Getting the date

    let newDate: DateTime = DateTime.local();

    if (date !== 'now')
        newDate = DateTime.fromJSDate(ensureDate(date, true));

    if (timeZone || flext?.timeZone)
        newDate = newDate.setZone(timeZone ?? flext?.timeZone);

    if (lang || flext?.lang)
        newDate = newDate.setLocale(lang ?? flext?.lang);


    // Defining the functions

    const _pad = (val: string|number, _padding: string|number = 2): string => String(val || '').padStart(Number(_padding), '0');

    const _format = (options: Obj = {}): string => {
        const day = options?.day;
        const month = options?.month;
        const year = options?.year;
        const weekday = options?.weekday;
        const hours = options?.hours;
        const minutes = options?.minutes;
        const seconds = options?.seconds;
        const _timeZone = options?.timeZone;
        const doUse12Hours = !!options?.doUse12Hours;
        const doUseGlobals = Boolean(options?.doUseGlobals ?? true);


        // Doing some checks

        if (doUseGlobals) return newDate.toLocaleString({
            day: day ?? dayFormat,
            month: month ?? monthFormat,
            year: year ?? yearFormat,
            weekday: weekday ?? weekdayFormat,
            hour: hours ?? hoursFormat,
            minute: minutes ?? minutesFormat,
            second: seconds ?? secondsFormat,
            timeZoneName: _timeZone ?? timeZoneFormat,
            hour12: Boolean(doUse12Hours ?? hours12),
        });


        return newDate.toLocaleString({
            day: day,
            month: month,
            year: year,
            weekday: weekday,
            hour: hours,
            minute: minutes,
            second: seconds,
            timeZoneName: _timeZone,
            hour12: doUse12Hours,
        });
    };

    const _alter = (options: Obj = {}): DateTime => {
        const doSubtract = !!options?.doSubtract;
        const handle = doSubtract ? newDate.minus.bind(newDate) : newDate.plus.bind(newDate);

        return handle({
            days: options?.days,
            months: options?.months,
            years: options?.years,
            weeks: options?.weeks,
            quarters: options?.quarters,
            hours: options?.hours,
            minutes: options?.minutes,
            seconds: options?.seconds,
            milliseconds: options?.milliseconds,
        });
    }

    const _add = (val: number, _units: string): DateTime => {
        const options: Obj = {};

        options[_units] = val;

        return _alter(options);
    };

    const _subtract = (val: number, _units: string): DateTime => {
        const options: Obj = {};

        options[_units] = val;

        return _alter({ ...options, doSubtract: true });
    };


    // If the 'pad' was passed

    if (isset(padding)) {
        switch (op) {
            case 'seconds':
                return _pad(newDate.second, padding);
            case 'minutes':
                return _pad(newDate.minute, padding);
            case 'hours':
                return _pad(newDate.hour, padding);
            case 'day':
                return _pad(newDate.day, padding);
            case 'month':
                return _pad(newDate.month, padding);
            case 'year':
                return _pad(newDate.year, 4);
            default:
                throw new TemplateSyntaxError(`Date: Operation ${audit(op)} is not compatible with argument 'padding'`);
        }
    }

    if (genitive) {
        switch (op) {
            case 'monthText':
                const dateText = _format({ day: 'numeric', month: 'long', doUseGlobals: false });
                const monthText = dateText.replace(/[^\p{L}]/gu, ''); // TODO: kr: Costyl to work with thw US dates

                return monthText.toLowerCase();
            default:
                throw new TemplateSyntaxError(`Date: Operation ${audit(op)} is not compatible with argument 'genitive'`);
        }
    }


    // Applying the operation

    switch (op) {
        case 'day':
            return newDate.day;
        case 'monthText':
            const monthText = _format({ month: 'long', doUseGlobals: false });
            return monthText.toLowerCase();
        case 'month':
            return newDate.month;
        case 'year':
            return newDate.year;
        case 'hours':
            return newDate.hour;
        case 'minutes':
            return newDate.minute;
        case 'seconds':
            return newDate.second;
        case 'format':
            return _format();
        case 'text':
            return _format({ day: dayFormat ?? 'numeric', month: monthFormat ?? 'long', year: yearFormat ?? 'numeric' });
        case 'startOf':
            return newDate.startOf(arg);
        case 'endOf':
            return newDate.endOf(arg);
        case 'unix':
            return newDate.toMillis();
        case 'iso':
            return newDate.toISOTime();
        case 'add':
            return _add(arg, units);
        case 'subtract':
            return _subtract(arg, units);
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

export function startOf(state: any): number {
    const args: any[] = state?.args ?? [];
    const [ date, period ] = args;

    return op({ ...state, args: [ date, 'startOf', period ] }) as number;
}

export function endOf(state: any): number {
    const args: any[] = state?.args ?? [];
    const [ date, period ] = args;

    return op({ ...state, args: [ date, 'endOf', period ] }) as number;
}

export function iso(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ date ] = args;

    return op({ ...state, args: [ date, 'iso' ] }) as string;
}

export function add(state: any): DateTime {
    const args: any[] = state?.args ?? [];
    const [ date, arg, units ] = args;

    return op({ ...state, args: [ date, 'add', arg, units ] }) as string;
}

export function subtract(state: any): DateTime {
    const args: any[] = state?.args ?? [];
    const [ date, arg, units ] = args;

    return op({ ...state, args: [ date, 'subtract', arg, units ] }) as string;
}


export default defineModule({
    helpers: {
        op: op,
        now: now,
        seconds: seconds,
        second: seconds,
        minutes: minutes,
        minute: minutes,
        hours: hours,
        hour: hours,
        days: day,
        day: day,
        monthText: monthText,
        months: month,
        month: month,
        year: year,
        format: format,
        text: text,
        startOf: startOf,
        endOf: endOf,
        unix: unix,
        iso: iso,
        add: add,
        subtract: subtract,
        sub: subtract,
        __default: op,
    },
});
