# Flext

Instructions for AI agents working with the repository.

---

## 0) Quick facts about this repository

* Purpose: a templating engine built on top of Handlebars with the **FlextDoc DSL** (directives, modules, data model, CSS)
* Stack: `TypeScript`, `Handlebars`, `UnoCSS`
* Core entities:
    * `SimpleFlext` — base class: AST, data, helpers, HTML/CSS rendering
    * `Flext` — extended class: directive parsing (`@v`, `@use`, `@lineHeight`, `@field`), modules, metadata model
    * Modules: `put`, `math`, `cond`, `match`
    * Utilities/types: parser helpers, collectors, `getDataModel`, `MetadataModelNode`, `Macro`, `MacroParam`, etc
* Structure overview:
    * `src/` — main source code (`Flext`, parser, helpers, modules)
    * `dist/` — compiled output (`index.js`, `index.cjs`, `index.d.ts`, `index.css`)
    * `test/` — unit tests (Vitest)
* Build:
    * ESBuild (CJS + ESM) via `bin/build.mjs`, types via `tsc`+`tsc-alias`, CSS via UnoCSS/Tailwind
* Scripts:
    * `npm run build` — full build + tests
    * `npm run test` / `npm run test-only` — Vitest
    * `npm run build-only` — build without tests

> Agents: before making changes, read `README.md`, `package.json`, public docs, and the generated `dist/index.d.ts`.

---

## 1) Agent protocol

1. **Understand the task:**
   * Create a concise plan (3–7 steps) and follow it
2. **Minimal diff:**
   * Modify only the files and sections required for the task.  
   ❌ No mass refactoring or formatting changes across unrelated code.
3. **Maintain public API stability:**
   * Preserve signatures of `Flext`, `SimpleFlext`, modules and exported helpers unless a breaking change is explicitly required and approved
4. **DSL is the source of truth:**
   * Do not change the semantics or syntax of directives (`@v`, `@use`, `@field`, etc.) without updating parsing logic, tests, docs, and examples
5. **Tests and build:**
   * Run `npm run build` (or at least `build-only` + `test-only`) before committing
6. **Documentation:**
   * When functionality changes, update related comments, docs, and examples

---

## 2) Architecture and code placement

### 2.1. Parser and low-level utilities

Responsible for:

* Parsing Handlebars --> AST (`getAst`)
* Compiling templates (`getTemplate`), rendering HTML (`getHtml`)
* Generating CSS through UnoCSS (`getCss`)
* Collecting paths from AST (`getPaths`) and building the data model (`getDataModel`)
* Parsing directives (`getMacros`, `getMacroParams`, `RegexHelper`, `FilterHelper`)

Requirements:

* Functions must remain **pure**, with no hidden state
* No framework dependencies (Vue/React/etc.)
* Regex changes **must** be covered with regression tests

### 2.2. Classes `SimpleFlext` and `Flext`

**SimpleFlext:**

* Stores `ast`, `data`, `helpers`
* `setTemplate` resets everything and parses the template
* `getHtml` renders back through Handlebars
* `getCss` renders HTML + feeds it through UnoCSS

**Flext:**

* Adds:
    * Metadata properties (`version`, `lang`, `title`, `lineHeight`, `fields`, etc.)
    * Directive parsing inside `setTemplate`
    * Module system (`useModule`, `addModule`)
    * Data model generation (`getDataModel`)
    * Validation (`getIsValid`)

Requirements:

* **`setTemplate` is the main integration point.** New features tied to templates must be integrated there
* Do not weaken or remove safety guards (`PotentialLoopError`, depth checks).

### 2.3. FlextDoc directives

Format: Handlebars comments:

```hbs
{{!-- @directiveName directiveParam ... --}}
```

Main directives:

* `@v` — template version
* `@use` — enabled modules
* `@lineHeight` — document line height
* `@field` — data model description (type, label, required, etc.).

Requirements:

* Do not change parameter format without updating all regexes, logic, docs, and tests
* New directives must:
    * Be documented clearly
    * Have parsing tests
    * Integrate into `setTemplate`

### 2.4. Modules (`put`, `math`, `cond`, `match`)

Modules export helpers via:

```ts
export default {
  helpers: {
    __default: helperWithColor,
    noColor: helper,
    plus: plus,
    // ...
  }
}
```

Meaning:

* `__default` --> used as `{{ put ... }}` or `{{ math ... }}`
* Others --> `{{ put:noColor ... }}`, etc.

Semantics (short):

* `put` — value with fallback, optional colored wrapper
* `math` — arithmetic (`plus`, `minus`, `round`, `percent`, ...)
* `cond` — boolean helpers (`equal`, `and`, `greater`, ...)
* `match` — block-based switch/case-style logic.

Requirements:

* Do not alter the intuitive behavior of existing helpers
* When adding new helpers/modules:
    * Update module list & documentation
    * Add usage examples

---

## 3) Code style

Flext code should be **straightforward, explicit, and predictable**.

### 3.1. General principles

* One function — one responsibility
* Prefer **early returns** instead of deep nesting
* Function size target: **≤40–60 lines**
* Nesting depth: **≤3 levels**
* Prefer named helpers over long inline callbacks

### 3.2. Naming rules

* **Data --> nouns:**
  `macros`, `fields`, `model`, `options`, `node`, `paths`
* **Actions --> verbs:**
  `getAst`, `getHtml`, `getCss`, `getMacros`, `ensureTitle`, `applyValueOptionsToFields`
* No unclear abbreviations
* No humorous names — this is a long-lived runtime library

### 3.3. Function structure pattern

Preferred 4-step pattern:

1. **Doing some checks** — validate input
2. **Getting the data** — prepare required variables
3. **Defining the functions** — local helpers if needed
4. **Main flow** — execute the core logic

Example:

```ts
export function ensureTitle(val: string|number|null): string {

    // Doing some checks

    if (val == null) return '';


    // Getting the data

    let title = stripHtml(String(val)).trim();


    // Defining the functions

    const filter = (search: RegExp, val: string = ''): void => { title = title.replace(search, val); };


    // Getting the title

    filter('\n', ' ');
    filter(/\s{2,}/g, ' ');
    filter(/[^\p{L}\d\s]/gu);


    return title.trim();
}
```

### 3.4. Breaking down “fat” functions

❌ **Bad** — a 200-line `getDataModel()` doing parsing+regex+merging+normalization.

✔️ **Good** — split into readable steps:

```ts
export function getDataModel(ast: AST.Program): DataModel {

    // Doing some checks

    if (!ast) throw new BaseError('Data Model: Unable to get data model: Missing AST');


    // Getting the data

    const [ first, ...paths ] = getPaths(ast);


    // Defining the functions

    const applyPaths = (model: DataModel, list: string[]) => {
        for (const p of list) model.addPath(p);
    };


    // Getting the model

    const model = pathToDataModel(first);

    applyPathsToModel(paths, model);


    return model;
}
```

### 3.5. Comments

Comments should explain **why**, not the syntax.

Use these markers consistently:

* `// Constants`
* `// Variables`
* `// Doing some checks`
* `// Getting the data`
* `// Defining the functions`
* `// TODO: username:` — planned improvement
* `// FIXME: username:` — known issue

Example:

```ts
// TODO: kr: The order of checks is important for proper macro parsing
export function getMacroParam(val: string): MacroParam | null {

    // Defining the functions

    const match = (regex: RegExp) => val.match(regex) ?? null;


    // Getting the data

    const p = match(RegexHelper.macroParam);
    const named = match(RegexHelper.macroNamedParam);
    const simple = match(RegexHelper.macroSimpleParam);


    // Getting the macro param

    if (p)
        return { name: p.groups!.value!, value: p.groups!.value! };

    else if (named)
        return { name: named.groups!.name!, value: named.groups!.value! };

    else if (simple)
        return { name: simple.groups!.name!, value: null };

    else
        return null;
}
```

---

## 4) Data model & validation

* Data model is built from AST paths (`getPaths` --> `pathToDataModel` --> `DataModel.addPath`)
* `Flext.getDataModel`:
    * Ignores nodes that match helper names
    * Merges metadata from `@field` directives
    * Produces a nested `MetadataModelNode[]`
* Depth limits (`DEFAULT_MODEL_DEPTH`) and loop protection (`PotentialLoopError`) must stay intact

When modifying model-related code:

* Never remove safety guards
* Test deeply nested paths, repeated segments, helper collisions

---

## 5) JS API and usage examples

Public API must remain **clean and predictable**:

* `setTemplate`
* `setData`
* `useModule`
* `getHtml`
* `getCss`
* `model`
* `isValid`

Examples in docs are part of the public contract. If behavior changes --> update examples immediately.

Recommended minimal example:

```ts
import Flext from '@trustme24/flext';

const template = `
  {{!-- @v "1.0.beta3" --}}
  {{!-- @use "put" --}}
  <p>Hello, {{ put user.name "Guest" }}!</p>
`;

const flext = new Flext(template, { user: { name: 'Anna' } });

console.log(flext.html);
console.log(flext.model);
```

---

## 6) Prohibitions & caution

* ❌ Don’t change directive formats (`@v`, `@use`, `@lineHeight`, `@field`) without updating regexes, logic, docs, tests
* ❌ Don’t change the semantics of built-in modules (`put`, `math`, `cond`, `match`)
* ❌ Don’t introduce framework-specific logic (Vue/React/etc.) into the core library
* ❌ Don’t add heavy dependencies without justification
* ❌ Don’t remove warnings/errors (`BaseWarning`, `BaseError`, `PotentialLoopError`) — they are part of the safety layer

---

## 7) Pre-commit checklist

* [ ] Task is completed according to the plan
* [ ] Public API has not been broken unintentionally
* [ ] Parser/directive/module changes are covered with tests
* [ ] Code style follows the established pattern (checks --> data --> helpers --> main flow)
* [ ] Documentation/examples updated if behavior changed
* [ ] `npm run build` and `npm run test` pass without errors
