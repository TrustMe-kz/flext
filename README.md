## Flext

Flext is a lightweight extension over Handlebars. It introduces a small DSL for handling macros and modules to help create dynamic templates. The library is compiled to both ESM and CommonJS bundles and can be embedded in other projects such as Vue components.

Public documentation is available at [TrustMe Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE).

Flext is maintained by **DauInvest** (Astana, Kazakhstan).

### Example
```ts
import { Flext } from '@trustme24/flext';

const template = `
{{!-- @use "put" --}}
<td>{{ put data.name 'Guest' }}</td>
`;

const fx = new Flext(template, { data: { name: 'Kenny' } });
console.log(fx.html); // <td><span class="text-blue-500">Kenny</span></td>
```

## Installation

```bash
npm install @trustme24/flext
```
