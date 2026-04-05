# Flext

[![Static Badge](https://img.shields.io/badge/GitHub-Star%20%281%29-yellow?logo=github)](https://github.com/TrustMe-kz/flext)
[![Static Badge](https://img.shields.io/badge/NPM-Download%20%285480%29-blue)](https://www.npmjs.com/package/@trustme24/flext)
[![Static Badge](https://img.shields.io/badge/CodeSandbox-Preview%20%2853%29-black)](https://codesandbox.io/p/devbox/trustme24-flext-f5x2hy)

![trustme24_flext_cover.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_logo_cover.jpg)

**Flext** is a technology for building reliable document templates.

In many systems, templates start simple and gradually become fragile: fields appear without documentation, rendering logic spreads across multiple layers, versions break compatibility, and debugging becomes difficult. Flext addresses this problem by allowing templates to describe the structure and requirements of the document itself.

A Flext template can contain Markup, Metadata, Modules, and rendering hints in a single artifact. This makes templates easier to reuse, validate, and embed into larger systems such as document pipelines, reporting services, or contract generation platforms.

- [GitHub: TrustMe-kz/flext](https://github.com/TrustMe-kz/flext)  
- [NPM: @trustme24/flext](https://www.npmjs.com/package/@trustme24/flext)  
- [Demo: Available at CodeSandbox](https://codesandbox.io/p/devbox/trustme24-flext-f5x2hy)  
- [Documentation: Available at TrustMe Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE)

---

## Installation

```shell
npm i @trustme24/flext tailwindcss
```

Add the **CSS** import:

```css
@import "@trustme24/flext/index.css";
```

🎉 **That's It!**

---

## The Problem

Document templating often looks simple at first. Over time it tends to accumulate hidden complexity.

Typical issues include: undocumented fields, incompatible template versions, duplicated rendering logic across services, fragile helper usage, and weak validation before rendering.

![trustme24_flext_abstract_painting.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_abstract_painting.jpg)

### A few common scenarios illustrate the problem:

1. **A template expects a field that is not provided at runtime. The result is either a broken document or silent incorrect output.**  
Solution with Flext: The template can explicitly declare required fields using Metadata so missing data is detected early.

————————————

2. **Multiple services use the same template but apply different helper logic or formatting rules.**  
Solution with Flext: Templates can declare Module dependencies so rendering logic is predictable and consistent.

————————————

3. **Templates evolve but older documents still rely on previous versions.**  
Solution with Flext: Templates can carry explicit Version information and compatibility rules.

---

## What It Provides

**Flext** builds on top of [Handlebars](https://handlebarsjs.com/) and keeps its familiar syntax while adding a small metadata layer. The goal is not to replace existing template engines but to make document templates safer and easier to maintain.

Instead of treating templates as plain text files, Flext treats them as structured artifacts. A template can include Markup, Metadata directives, and Module dependencies, all stored together.

This approach helps systems understand what a template requires before rendering it.

### Quick Start:

```ts
import Flext from '@trustme24/flext';

const template = `
  {{!-- @syntax "1.0" --}}
  {{!-- @use "put" --}}
  <p>{{ put name 'Unknown user...' }}</p>
`;

const flext = new Flext(template, { name: 'Anna' });

document.body.innerHTML = flext.html;
```

---

## Core Ideas

A **Flext** template contains three conceptual layers. The first layer is markup: HTML and standard Handlebars expressions. The second layer is Metadata written as directives such as `@syntax`, `@field`, or `@use`. The third layer is runtime behavior provided through Modules and helpers.

Keeping these elements close together makes templates easier to move between systems and reduces hidden assumptions.

Metadata directives can describe template Version, language, title, rendering parameters, and required fields. Modules provide reusable logic such as formatting numbers, inserting fallback values, or conditional rendering.

### Example

```ts
import Flext from '@trustme24/flext';

const template = `
  {{!-- @syntax "1.0" --}}
  {{!-- @use "put" --}}
  {{!-- @group "data" --}}
  {{!-- @field "data.helloWorld" type="string" label="Hello World" required --}}

  <p class="text-center">
    {{ put data.helloWorld 'No hello world...' }}
  </p>
`;

const flext = new Flext(template, {
  data: { helloWorld: 'Hello World!' },
});

console.log(flext.html);   // <p class="...">Hello World!</p>
console.log(flext.model);  // {"name":"data","$":[{"name":"helloWorld"}]}
```

> 💡 **In this example** the template carries additional information: Version, Field definition, and Module usage. This allows runtime tools to build a Data Model, validate input, and render HTML predictably.

---

## Use Cases

![trustme24_flext_use_cases.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_use_cases.jpg)

**Flext** is intended for structured document generation. Common examples include contracts, invoices, reports, certificates, and internal document workflows. It is particularly useful when templates must be versioned, validated, reused across services, or rendered in multiple environments.

Flext can be used on its own, but it is also designed to serve as a core library inside larger systems. Related tools include [Vue Flext](https://www.npmjs.com/package/vue-flext) for Vue integration, [flext2pdf](https://www.npmjs.com/package/flext2pdf) for HTML‑to‑PDF rendering, [Flext File](https://www.npmjs.com/package/flext-file) for portable document packaging and transfer, and some **Flext Service** for running document rendering as a microservice.

Together these components allow Flext to power full document pipelines while remaining a lightweight core library.

---

## Writing Templates

Templates should stay declarative and focused on layout. Business logic is usually better handled in Modules or application code. Metadata directives such as `@field` help document required data and make validation possible.

### Example:

```handlebars
{{!-- @syntax "1.0" --}}
{{!-- @use "put" "date" --}}
{{!-- @group "data" --}
{{!-- @field "data.city" type="string" label="City" required --}}
{{!-- @field "data.date" type="date"   label="Date" required --}}

<p>
  {{ put data.city "City" }}, {{ put (date:text data.date "No date...") }}
</p>
```

### Best practices

Treat templates as versioned artifacts. Prefer explicit metadata over hidden assumptions. Keep helper usage predictable and document important data paths with `@field`. Test templates with realistic data and separate document layout from application business rules.

### Limitations

Flext is intentionally focused. It is not a full programming language, not a WYSIWYG editor, and not a complete document management system. Its role is to act as a reliable template core inside document generation workflows.

---

## API

The main entry point is the `Flext` class.

### Constructor:

```ts
import Flext from '@trustme24/flext';

new Flext().setTemplate('...').setData({});
```

[More information about the API is available at TrustMe Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE).

---

## Architecture

**Flext** operates as a simple pipeline.

```text
Template
  v
Parser / AST
  v
Directives / Modules
  v
PDF / Preview / Data Model / Export
```

At runtime Flext parses the template, extracts Metadata, registers Modules, builds a Data Model, and generates preview. The output can then be passed to other tools to display, store, or generating PDF. Flext-based documents can also be packaged as `.flext` artifacts with [Flext File](https://www.npmjs.com/package/flext-file) for portable storage or transfer between systems.

- [Repo: More information about the repo can be found in ARCHITECTURE.md](https://github.com/TrustMe-kz/flext/blob/main/ARCHITECTURE.md)
- [Documentation: More information about the API is available at TrustMe Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE)

---

## Development

```shell
npm run test:app
```

Run **Tests**:

```shell
npm run test
```

[More information about the contribution can be found in CONTRIBUTING.md](https://github.com/TrustMe-kz/flext/blob/main/CONTRIBUTING.md).

---

## Roadmap

Future development focuses on improving reliability and adoption. Planned areas include stronger template validation, better parser and AST tooling, clearer compatibility rules, improved module authoring experience, richer documentation, ecosystem integrations, editor support, and a template corpus for regression testing.

![trustme24_flext_abstract_painting.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_abstract_painting.jpg)

- **Contributions** are welcome. Useful areas include documentation, example templates, modules, parser improvements, performance optimizations, and test coverage. Changes that affect the template syntax or core semantics should first be discussed in issues so architectural decisions remain consistent.

————————————

- **Governance:** Flext is maintained by [TrustMe](https://trustme24.com/). External contributions are encouraged while core design decisions remain centralized to keep the language and runtime coherent.

————————————

- **Security:** If you discover a security issue, please report it privately to [i.am@kennyromanov.com](mailto:i.am@kennyromanov.com) instead of opening a public issue

————————————

- **License:** Flext is released under the [MIT License](https://github.com/TrustMe-kz/flext/blob/main/LICENSE)

---

**Flext by Kenny Romanov**  
TrustMe
