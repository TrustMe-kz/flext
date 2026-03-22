import { defineModule } from '@/lib';


// Functions

export function op(state: any): any[] | boolean {
    const args: any[] = state?.args ?? [];
    const [ op, str ] = args;


    // Applying the operation

    switch (op) {
        case 'json':
            return JSON.parse(str);
        case 'check':
            return typeof str === 'string';
        default:
            return op;
    }
}

export function json(state: any): any[] {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'json', str ] }) as any[];
}

export function check(state: any): boolean {
    const args: any[] = state?.args ?? [];
    const [ str ] = args;

    return op({ ...state, args: [ 'check', str ] }) as boolean;
}


export default defineModule({
    helpers: {
        op: op,
        json: json,
        check: check,
        __default: op,
    },
});
