import { SafeString } from 'handlebars';
import { Obj } from '@/types';
import { defineModule } from '@/lib';


// Contents

export const DEFAULT_COLOR = 'text-blue-500';


// Functions

export function put(state: any): string {
    const args = state?.args ?? [];
    const [ val, fallback ] = args;

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
