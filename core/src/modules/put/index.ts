import { SafeString } from 'handlebars';
import { Obj } from '@/types';
import { defineModule, isNumber, inarr, ensureDate } from '@/lib';
import { format } from '../date';


// Contents

export const DEFAULT_COLOR = 'text-blue-500';


// Functions

export function put(state: any): string {
    const flext = state?.flext ?? {};
    const args = state?.args ?? [];
    const [ val, fallback ] = args;
    const options = state?.options ?? {};
    const namedArgs = state?.namedArgs ?? {};
    const self = state?.self ?? {};
    const getContent = state?.getContent ?? defaultGetContent;
    const date = ensureDate(val, false);


    // If the value is a valid date

    if (date && !isNumber(val) && !inarr(val, true, false)) return format({
        flext: flext,
        args: [ date ],
        options: options,
        namedArgs: { ...namedArgs, fallback },
        self: self,
        getContent: getContent,
    });


    return val ?? fallback ?? '';
}

export function putWithColor(state: any): SafeString {
    const namedArgs: Obj = state?.namedArgs ?? {};
    const color = namedArgs?.color ?? DEFAULT_COLOR;

    if (color)
        return new SafeString(`<span class="${color}">${put(state)}</span>`);
    else
        return new SafeString(state);
}

export function defaultGetContent(): null {
    // The default 'getContent' function does nothing...
    return null;
}


export default defineModule({
    helpers: {
        noColor: put,
        __default: putWithColor,
    },
});
