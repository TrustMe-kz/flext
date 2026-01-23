import { SafeString } from 'handlebars';
import { Obj } from '@/types';
import { isNumber, defineModule } from '@/lib';
import { putWithColor } from '@/modules/put';
import writtenNumber from 'written-number';
import kkKz from './locales/kkKz.json';
import localeNames from './localeNames.json';


// Constants

export const DEFAULT_LANG = 'en';

export const LOCALES: Obj = {
    'kk-KZ': kkKz,
};


// Functions

export function op(state: any): number|string|boolean {
    const flext: Obj = state?.flext ?? {};
    const args: any[] = state?.args ?? [];
    const namedArgs: Obj = state?.namedArgs ?? {};
    const [ number, op ] = args;
    const { lang, strict } = namedArgs;


    // Defining the functions

    const locale = (lang: string): string | Obj | null => {
        return localeNames[lang] ?? LOCALES[lang] ?? null;
    };


    // Getting the locale

    const newLang = locale(lang) ?? locale(flext?.lang) ?? DEFAULT_LANG;


    // Matching an operation

    switch (op) {
        case 'text':
            return writtenNumber(Number(number), { lang: newLang });
        case 'check':
            return strict ? typeof number === 'number' : isNumber(number);
        default:
            return Number(number);
    }
}

export function opWithColor(state: any): SafeString {
    const namedArgs: Obj = state?.namedArgs ?? {};
    const fallback = namedArgs?.fallback ?? '';
    const result = op(state);

    if (result === 0)
        return putWithColor({ ...state, args: [ '0' ] });
    else if (typeof result === 'number' && isNaN(result))
        return putWithColor({ ...state, args: [ fallback ] });
    else
        return putWithColor({ ...state, args: [ result || fallback ] });
}

export function text(state: any): SafeString {
    const args: any[] = state?.args ?? [];
    const [ number, fallback ] = args;
    const namedArgs: Obj = state?.namedArgs ?? {};

    return opWithColor({
        ...state,

        args: [ number, 'text' ],
        namedArgs: { fallback, ...namedArgs },
    });
}

export function check(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ number ] = args;

    return op({ ...state, args: [ number, 'check' ] }) as boolean;
}


export default defineModule({
    helpers: {
        op: opWithColor,
        text: text,
        check: check,
        noColor: op,
        __default: opWithColor,
    },
});
