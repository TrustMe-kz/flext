## Flext

**Flext** is a lightweight extension over Handlebars. It introduces a small DSL for handling macros and modules to help create dynamic templates. The library is compiled to both ESM and CommonJS bundles and can be embedded in other projects such as [Vue components](https://www.npmjs.com/package/vue-flext).

Public documentation is available at [Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE).

Flext is maintained by [TrustMe](https://trustme24.com/).

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

1. Install **dependencies**:

```shell
npm i tailwindcss @trustme24/flext
```

2. Add the **CSS** import in your CSS file:

```css
@import "@trustme24/flext/index.css";
```

3. **You're all set!**

---
**Flext by Kenny Romanov**  
TrustMe
