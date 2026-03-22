import { Obj } from '@/types';
import { isNumber, defineModule } from '@/lib';
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
    const [ op, number ] = args;
    const { lang, strict } = namedArgs;


    // Defining the functions

    const locale = (lang: string): string | Obj | null => {
        return localeNames[lang] ?? LOCALES[lang] ?? null;
    };


    // Getting the locale

    const newLang = locale(lang) ?? locale(flext?.lang) ?? DEFAULT_LANG;


    // Applying the operation

    switch (op) {
        case 'text':
            return writtenNumber(Number(number), { lang: newLang });
        case 'check':
            return strict ? typeof number === 'number' : isNumber(number);
        default:
            return Number(op);
    }
}

export function text(state: any): string {
    const args: any[] = state?.args ?? [];
    const [ number ] = args;

    return String(op({ ...state, args: [ 'text', number ] }));
}

export function check(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ number ] = args;

    return op({ ...state, args: [ 'check', number ] }) as boolean;
}


export default defineModule({
    helpers: {
        op: op,
        text: text,
        check: check,
        __default: op,
    },
});
