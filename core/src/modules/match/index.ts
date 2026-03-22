import { defineModule } from '@/lib';


// Functions

export function _match(state: any): any {
    const args: any[] = state?.args ?? [];
    const [ value ] = args;
    const self = state?.self ?? null;
    const render = state?.getContent ?? null;


    // Setting the match data

    self.__flext_match_value = value;
    self.__flext_match_isCompleted = false;


    return render();
}

export function _case(state: any): any {
    const args: any[] = state?.args ?? [];
    const self = state?.self ?? null;
    const value = self.__flext_match_value ?? null;
    const render = state?.getContent ?? null;


    // Iterating for each value

    if (!self.__flext_match_isCompleted) for (const valueRef of args) if (value === valueRef) {
        self.__flext_match_isCompleted = true;
        return render();
    }


    return '';
}

export function _fallback(state: any): any {
    const self = state?.self ?? null;
    const value = self.__flext_match_value ?? null;

    return _case({ ...state, args: [ value ] });
}


export default defineModule({
    helpers: {
        case: _case,
        fallback: _fallback,
        __default: _match,
    },
});
