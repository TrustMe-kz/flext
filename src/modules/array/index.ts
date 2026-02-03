import { Obj } from '@/types';
import { defineModule } from '@/lib';


// Functions

export function op(state: any): any[] | boolean {
    const args: any[] = state?.args ?? [];
    const [ op, arr, prop ] = args;


    // Defining he functions

    const destruct = <T extends any = any>(val: Obj[], _prop: string): T[] => {
        const items = _prop?.split('.') ?? [];
        const result: T[] = [];


        // Iterating for each item

        for (const obj of val) {
            let cursor: any = obj;

            for (const item of items) cursor = cursor[item];

            result.push(cursor);
        }


        return result;
    };


    // Applying the operation

    switch (op) {
        case 'destruct':
            return destruct(arr, prop);
        case 'check':
            return Array.isArray(arr);
        default:
            return op;
    }
}

export function destruct(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ arr, prop ] = args;

    return op({ ...state, args: [ 'destruct', arr, prop ] }) as any[];
}

export function check(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ arr ] = args;

    return op({ ...state, args: [ 'check', arr ] }) as boolean;
}


export default defineModule({
    helpers: {
        op: op,
        destruct: destruct,
        check: check,
        __default: op,
    },
});
