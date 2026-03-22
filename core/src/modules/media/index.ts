import { Obj } from '@/types';
import { defineModule } from '@/lib';
import { TemplateError } from '@/errors';


// Functions

export function url(state: any): string {
    const flext: Obj = state?.flext ?? {};
    const args: any[] = state?.args ?? [];
    const [ name ] = args;
    const assets = flext?.assets ?? {};
    const asset = assets[name] ?? null;

    if (asset)
        return URL.createObjectURL(asset);
    else
        throw new TemplateError(`Media: Unable to get the asset: Asset '${name}' does not exist`);
}


export default defineModule({
    helpers: {
        url: url,
        __default: url,
    },
});
