import { SafeString } from 'handlebars';
import { Obj } from '@/types';
import { defineModule, isNumber, inarr, ensureDate } from '@/lib';
import { format } from '../date';


// Contents

export const DEFAULT_COLOR = 'text-blue-500';


// Functions

export function put(state: any): string {
    const args = state?.args ?? [];
    const [ val, fallback ] = args;
    const date = ensureDate(val, false);
    console.log( 'val', val, 'date', date);

    if (date && !isNumber(val) && !inarr(val, true, false))
        return format(date);
    else
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


export default defineModule({
    helpers: {
        noColor: put,
        __default: putWithColor,
    },
});
