import { defineModule } from '@/lib';


// Functions

export function matchHelper(state: any): any {
    const args: any[] = state?.args ?? [];
    const [ value ] = args;
    const self = state?.self ?? null;
    const render = state?.getContent ?? null;


    // Setting the match data

    self.__flext_match_value = value;
    self.__flext_match_isCompleted = false;


    return render();
}

export function caseHelper(state: any): any {
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

export function fallbackHelper(state: any): any {
    const self = state?.self ?? null;
    const value = self.__flext_match_value ?? null;

    return caseHelper({ ...state, args: [ value ] });
}


export default defineModule({
    helpers: {
        case: caseHelper,
        fallback: fallbackHelper,
        __default: matchHelper,
    },
});
