## Flext

Flext is a lightweight extension over Handlebars. It introduces a small DSL for handling macros and modules to help create dynamic templates. The library is compiled to both ESM and CommonJS bundles and can be embedded in other projects such as Vue components.

Public documentation is available at [TrustMe Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE).

Flext is maintained by **DauInvest** (Astana, Kazakhstan).

### Example
```ts
import { Flext } from '@trustme24/flext';

const template = `
  {{!-- @v "1.0" --}}
  {{!-- @use "put" --}}

  <div class="text-center text-red-500">{{ put data.helloworld 'No Hello World...' }}</div>
`;

const flext = new Flext(template, {
  data: { helloworld: 'Hello World!' },
});

document.body.innerHTML = flext.html;
```

## Installation

1. Install dependencies:

```shell
npm install tailwindcss
npm i @trustme24/flext
```

2. Add the CSS import:

Add `@import "@trustme24/flext/index.css";` in `src/index.css`.

3. You're all set!
