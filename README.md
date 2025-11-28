## Flext

[![Static Badge](https://img.shields.io/badge/GitHub-Star%20%281%29-yellow?logo=github)](https://github.com/TrustMe-kz/flext)
[![Static Badge](https://img.shields.io/badge/NPM-Download%20%28610%29-blue)](https://www.npmjs.com/package/@trustme24/flext)

**Flext** is a lightweight extension over Handlebars. It introduces a small DSL for handling macros and modules to help create dynamic templates. The library is compiled to both ESM and CommonJS bundles and can be embedded in other projects such as [Vue components](https://www.npmjs.com/package/vue-flext).

Public documentation is available at [Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE).

Flext is maintained by [TrustMe](https://trustme24.com/).

### Example
```ts
import { Flext } from '@trustme24/flext';

const template = `
  {{!-- @v "1.0.beta3" --}}
  {{!-- @use "put" --}}

  <div class="text-center text-red-500">{{ put data.helloWorld 'No hello world...' }}</div>
`;

const flext = new Flext(template, {
  data: { helloWorld: 'Hello World!' },
});

document.body.innerHTML = flext.html;
```

## Installation

1. Install **dependencies**:

```shell
npm i @trustme24/flext tailwindcss
```

2. Add the **CSS** import in your CSS file:

```css
@import "@trustme24/flext/index.css";
```

3. **You're all set!**

## Tests & Demo

- **Unit** Tests:

```shell
npm run test
```

- Test **App**:

```shell
npm run test:app
```

---
**Flext by Kenny Romanov**  
TrustMe
