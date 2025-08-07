import { SafeString } from 'handlebars';
import { defineModule } from '@/lib';


// Functions

export function put(state: any): string {
  const args = state?.args ?? [];
  const [ val, fallback ] = args;

  return val ?? fallback ?? '';
}

export function putWithColor(state: any): SafeString {
  return new SafeString(`<span class="text-blue-500">${put(state)}</span>`);
}


export default defineModule({
  helpers: {
    noColor: put,
    default: putWithColor,
  },
});
