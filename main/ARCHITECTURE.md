# Architecture — Flext

[< README.md](https://github.com/TrustMe-kz/flext/blob/main/README.md)

![trustme24_flext_cover.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_logo_cover.jpg)

This document explains how **Flext** is built internally.

Its purpose is simple: If you open the repository and want to make a change, this file should help you quickly answer two questions:

* Where should this change be made
* Why is the code organized this way

> 💡 **This is not a user guide.** It is an architecture guide for contributors and maintainers.

---

## 1. Flext at the Architecture Level

**Flext** is a core library for structured document templates.

It builds on top of Handlebars, but it does more than plain template rendering. A Flext template can contain markup, metadata, connected modules, and information about the data model. That is why Flext should be understood as a template core for document pipelines, not only as a rendering utility.

At a high level, Flext is responsible for four things: parsing templates, extracting metadata, building a data model, and rendering HTML/CSS.

Flext does **not** try to be a UI framework, a visual editor, or a complete document platform.

---

## 2. Main Flow

**Flext** works as a pipeline.

```text
Template String
  v
Handlebars AST
  v
Directive Extraction
  v
Module Registration
  v
HTML Rendering
  v
CSS Generation
  v
PDF / Preview / Data Model / Export
```

This flow matters because most changes belong to one specific stage. If you understand the stage, you usually understand where the code should be changed.

#### A few practical examples:

* If the change affects how comments like `@field` are parsed, the change belongs to the directive parsing layer
* If the change affects how `{{ put ... }}` behaves, the change belongs to the module layer
* If the change affects how nested field paths become model nodes, the change belongs to the model layer
* If the change affects final HTML output, the change belongs to the rendering layer

---

## 3. Repository Structure

The repository is split into a few clear areas.

* `src/` contains the source code of the library.
* `dist/` contains generated build artifacts published to consumers.
* `test/` contains unit tests and behavior checks.
* `bin/` contains build scripts.

#### If you are new to the codebase, the usual reading order is:

1. **Readme:** [Go to README.md](https://github.com/TrustMe-kz/flext/blob/main/README.md)
2. **Package:** [Go to package.json](package.json)
3. **Types:** [Go to types.ts](src/types.ts)
4. **Main Code:** [Go to index.ts](src/index.ts)
5. **Tests:** [Go to tests](test)

> ⚠️ **Source of truth** is always `src/`. Do not edit `dist/` manually.

---

## 4. Main Architectural Layers

Flext is easier to understand if you think in layers.

### 4.1 Parsing Layer

This layer turns a template string into a Handlebars AST. It also provides low-level helpers for template compilation, HTML generation, CSS generation, path extraction, and directive parsing support.

This layer should stay framework-agnostic and as pure as possible.

### 4.2 Directive Layer

This layer extracts FlextDoc directives from Handlebars comments and converts them into runtime metadata.

Examples: `@v`, `@use`, `@lineHeight`, `@field`, `@lang`, `@title`, `@timeZone`.

This layer is sensitive because small changes in syntax or regex behavior can affect many templates.

### 4.3 Module Layer

This layer provides reusable runtime helpers. Built-in modules such as `put`, `math`, `cond`, and `match` are registered here.

This is the main extension mechanism of Flext.

### 4.4 Model Layer

This layer builds a data model from template paths and enriches it with metadata from directives like `@field`.

This model is later used for validation and integration with higher-level tools.

### 4.5 Rendering Layer

This layer renders HTML from the compiled template and generates CSS through UnoCSS.

It should stay focused on output generation, not on UI framework concerns.

---

## 5. Core Classes

Two classes define most of the runtime behavior: `SimpleFlext` and `Flext`.

### 5.1 `SimpleFlext`

`SimpleFlext` is the low-level runtime base.

It stores `ast`, `data`, and `helpers`. It can parse a template, render HTML, and generate CSS. It does not deeply manage FlextDoc metadata.

Use this class as the mental model for the basic runtime cycle: template in, AST stored, HTML/CSS out.

### 5.2 `Flext`

`Flext` extends `SimpleFlext` with metadata-aware behavior.

It adds properties such as `version`, `lang`, `title`, `lineHeight`, and `fields`. It parses directives during `Flext.setTemplate`, registers modules, builds a metadata model, and performs validation.

This class is the main integration point for features connected to template metadata.

### 5.3 Why two classes exist?

The split is intentional.

`SimpleFlext` keeps the basic runtime small and reusable. `Flext` adds the document-specific behavior on top. This avoids mixing low-level rendering mechanics with higher-level FlextDoc behavior.

Do not merge these responsibilities casually. The split keeps the architecture readable.

---

## 6. `Flext.setTemplate` is the main integration point

If a feature is driven by template contents, `Flext.setTemplate` is usually the first place to inspect.

This method is important because it resets runtime state and rebuilds the object from the template again. In `Flext`, it is also where FlextDoc directives are applied.

#### Typical sequence:

1. Clear previous runtime state
2. Parse template into AST
3. Collect directives from AST
4. Apply metadata such as version, fields, and rendering parameters
5. Register connected modules

> 💡 **This makes** `Flext.setTemplate` the lifecycle center of the library.

**Architectural pattern:** template-driven behavior should enter the system through `Flext.setTemplate`, not through unrelated side paths.

**Do not do this:** add template-dependent behavior that bypasses `Flext.setTemplate` and leaves object state inconsistent.

---

## 7. FlextDoc Directives

**FlextDoc** directives are stored inside Handlebars comments.

### Example:

```hbs
{{!-- @dialect "1.0" --}}
{{!-- @use "put" --}}
{{!-- @field "data.city" type="string" label="City" required --}}
```

This format is simple and portable. Templates stay text-based and compatible with the surrounding Handlebars world.

#### Main directives include:

* `@v` for template version
* `@use` for connected modules
* `@lineHeight` for rendering options
* `@field` for data model metadata
* `@lang`, `@title`, `@timeZone` for template-level configuration

### 7.1 How directive parsing works

Directive parsing happens in stages:

* AST comment collection
* Macro detection
* Macro parameter extraction
* Conversion into internal runtime metadata

> 💡 **This logic relies heavily** on regex-based helpers and focused collectors.

### 7.2 Why this area is sensitive

Directive parsing is one of the most fragile parts of the system. A small regex change can silently alter how templates are interpreted.

Because of that, syntax changes are high-impact changes.

**Do not do this:** change directive parameter format in one place only. If directive syntax changes, update regexes, parsing logic, tests, docs, and examples together.

---

## 8. Macro Parsing Internals

A few helpers power directive parsing.

* `getMacros` extracts directive-like structures from collected comments.
* `getMacroParams` parses directive parameter sequences.
* `getMacroParam` parses one token into a structured parameter.
* `RegexHelper` stores the main regex definitions.
* `FilterHelper` provides reusable matching filters.

This part of the code should stay focused and explicit. Avoid clever shortcuts. Regex-heavy parsing becomes hard to debug very quickly.

**Architectural pattern:** one helper, one parsing responsibility.

**Do not do this:** turn one parsing helper into a large multi-purpose function that mixes collection, normalization, validation, and transformation.

---

## 9. AST Collectors and Traversal

**Flext** uses focused AST collectors instead of one giant traversal function.

Examples include collectors for comments and collectors for data paths. This gives the project a cleaner inspection model: each collector answers one question about the AST.

This is good for testing and future extension. It is easier to reason about “comment collection” and “path collection” separately than to debug one universal walker.

**Architectural pattern:** small, purpose-specific visitors are preferred over one large generic pass.

---

## 10. Data Model Architecture

One of the key ideas in **Flext** is that templates implicitly describe data.

If a template refers to `data.user.name`, that path is part of the template contract. Flext collects these paths and turns them into a nested model. Then it enriches the result with metadata from `@field` directives.

This model is useful for validation, form generation, debugging, and UI wrappers.

### 10.1 Main Steps

The model layer works roughly like this:

1. Extract paths from AST
2. Ignore names that belong to helpers
3. Convert paths into nested nodes
4. Merge repeated segments cleanly
5. Enrich nodes using declared field metadata

### 10.2 Safety Rules

This layer must remain defensive. Deep nesting and repeated path segments can create bad recursion patterns if handled carelessly.

That is why Flext keeps depth limits and loop guards such as `DEFAULT_MODEL_DEPTH` and `PotentialLoopError`.

**Do not do this:** remove depth checks because they look unnecessary. They are part of the safety design.

**Do not do this:** allow helper names to leak into the data model. Helper/model collisions are a real source of broken structure.

---

## 11. Validation Architecture

Validation sits on the boundary between template structure and runtime data.

Flext can validate input against the generated metadata model. It uses field metadata such as `required` and `type`, together with the structure inferred from the template.

This is why validation is not only a UI concern. The template itself already knows something about the expected data shape, and Flext exposes that knowledge.

If you change validation logic, also inspect the model layer. Validation usually depends on model semantics.

---

## 12. Module System Architecture

Modules are the main way to extend **Flext** behavior without bloating the core syntax.

### A module exports helpers through a simple structure:

```ts
export default {
  helpers: {
    some: some,
    __default: op,
  }
}
```

#### This means:

* `__default` becomes `{{ put ... }}` or `{{ math ... }}`
* named helpers become `{{ put:noColor ... }}` or `{{ math:plus ... }}`

### 12.1 Built-in modules

The main built-ins are:

* `put` for fallback-aware output
* `math` for arithmetic operations
* `cond` for boolean and comparison helpers
* `match` for block-based switch/case-style logic

### 12.2 Registration flow

* `useModule` loads built-in modules by name
* `addModule` registers a custom module

This layer is also tied to template semantics, because helper names affect both rendering and data model behavior.

**Architectural pattern:** modules are preferred over hardcoding one-off helper logic into the core.

**Do not do this:** change built-in helper behavior casually. Built-in module semantics are part of the public contract.

---

## 13. Rendering Architecture

Rendering is intentionally simple.

HTML rendering compiles the template and applies merged data and helpers. CSS generation renders HTML first and then passes the result through UnoCSS.

This design is important because CSS is a derivative product of rendered content. The primary source remains the template and its rendered HTML.

Flext keeps rendering framework-agnostic on purpose. That allows the same core to be used in browser previews, server-side pipelines, and PDF services.

**Do not do this:** add Vue-, React-, or UI-specific logic into the core rendering path.

---

## 14. Public API as an Contract

**The public API** is not only a convenience layer. It is an architectural contract.

#### Important public entry points include:

* `Flext.setTemplate`
* `setData`
* `setHelpers`
* `addHelper`
* `useModule`
* `addModule`
* `getHtml` and `html`
* `getCss`
* `getDataModel` and `model`
* `getIsValid` and `isValid`

These APIs should stay predictable. If internal refactoring changes behavior, it must preserve the external contract unless a breaking change is explicitly planned.

Examples in docs are part of this contract too.

**Do not do this:** change a public method signature or behavior quietly and hope consumers will adapt.

---

## 15. Build & Distribution

**Flext** is authored in TypeScript and built into ESM and CommonJS bundles. Types are generated separately, and CSS is built through the UnoCSS/Tailwind pipeline.

The published package surface is reflected in `dist/`.

This has one simple consequence for contributors: if you change runtime behavior, you should verify that the generated artifacts still match the intended source behavior.

---

## 16. Testing Strategy

Tests protect semantics, not only syntax.

Different parts of the system need different kinds of tests:

* Parser tests for AST and macro behavior
* Regression tests for regex-sensitive logic
* Module tests for built-in helpers
* Model tests for nested paths, repeated segments, and helper collisions
* Rendering tests for HTML/CSS output
* Validation tests for required/type-aware behavior

**Do not do this:** change regex parsing, directive handling, or model generation without regression coverage.

> ⚠️ **When changing a sensitive area**, always ask: what behavior am I protecting with this test?

---

## 17. Error & Warning System

The error layer is part of **Flext’s** safety design.

Important classes include:

* `BaseError` for critical failures
* `BaseWarning` for non-fatal diagnostics
* `PotentialLoopError` for pathological model depth cases

These are not decorative. They help preserve debuggability and runtime safety.

**Do not do this:** remove warnings or errors because they make code look stricter. They often encode important failure boundaries.

---

## 18. Stability Boundaries

Some parts of **Flext** are much more sensitive than others.

Stability-sensitive areas include directive syntax, built-in module semantics, public API signatures, metadata model shape, and `Flext.setTemplate` lifecycle behavior.

Other areas are safer to evolve, such as documentation, tests, example templates, and small internal extractions that preserve behavior.

> 💡 **A useful rule is simple:** If the change affects template interpretation, treat it as high-impact.

---

## 19. Safe Change Zones vs. Sensitive

### Safer areas

Safer areas include docs, examples, test coverage, and non-breaking internal cleanups.

Adding a new helper module can also be relatively safe if it does not change existing behavior.

### Sensitive areas

Sensitive areas include regex helpers, directive parsing, model generation, helper/model collision logic, `Flext.setTemplate`, and built-in helper semantics.

Changes here require tighter review and stronger tests.

---

## 20. Common Extension Scenarios

This section answers the practical question: where should I change code?

### 20.1. Add a new module

**Main places:** Module source, registration path, tests, docs, examples.

### 20.2. Add a new directive

**Main places:** Regex/parsing helpers, directive application in `Flext.setTemplate`, tests, docs, examples.

### 20.3. Change how the data model works

**Main places:** Path collection, path-to-model conversion, metadata merge logic, validation tests.

### 20.4. Improve validation

**Main places:** Model-aware validation logic, field metadata handling, tests for required/type behavior.

### 20.5. Optimize rendering

**Main places:** Compile/render helpers, HTML generation path, CSS generation behavior, output tests.

### 20.6. Add framework integration

> ⚠️ Usually **Not** in the core library. Prefer wrappers or separate packages.

---

## 21. Architectural Patterns

A few patterns show up repeatedly in the codebase.

### 21.1. Explicit over magical

State changes should be visible and local. Hidden behavior makes template systems harder to debug.

### 21.2. Small focused helpers

Prefer one helper with one purpose over large mixed utilities.

### 21.3. Layered responsibilities

Parsing, metadata, model generation, modules, and rendering should stay conceptually separate.

### 21.4. Modules over core bloat

If behavior can live as a reusable module, that is often better than expanding the core syntax.

### 21.5. Safety guards are features

Depth checks, loop guards, warnings, and explicit errors are part of the architecture, not clutter.

---

## 22. What Flext architecture intentionally avoids

**Flext** avoids several things on purpose.

It avoids framework-specific logic in the core. It avoids hidden mutable global state. It avoids turning templates into a full programming language. It avoids silent semantic changes. It avoids mixing business workflow logic into the parser/runtime core.

> 💡 **These limits** are part of why the library stays understandable.

---

## 23. How to work safely in this codebase

Start with the smallest possible change. First identify the affected layer. Then inspect the relevant tests. After that, change behavior locally and update tests before widening the diff.

Good changes in Flext are usually small, explicit, and easy to review.

Bad changes usually look like this: one PR changes regexes, parser flow, helper semantics, and public examples at the same time without a clear boundary.

**Preferred approach:** checks first, then data preparation, then local helpers, then main flow. Keep functions straightforward and avoid deep nesting.

**Do not do this:** use one large refactor to “clean up everything nearby.” In a template core, unrelated cleanup often hides semantic regressions.

---

## 24. Reading order for new contributors

If you want to understand **Flext** quickly, use this order:

1. Read [README.md](https://github.com/TrustMe-kz/flext/blob/main/README.md)
2. Read [SimpleFlext](src/index.ts)
3. Read [Flext](src/index.ts)
4. Inspect parser helpers and collectors
5. Inspect built-in modules
6. Read tests for actual behavior

> 💡 **This order mirrors** the architecture: public contract first, internal mechanics second.

---

## 25. Final Rule of Thumb

When you are unsure where to make a change, ask one direct question:

**Is this change about parsing, metadata, modules, model generation, validation, or rendering?**

Pick one first. Start there. Do not begin with a wide refactor.

That simple rule is usually enough to keep Flext changes safe and understandable.

---

**Flext by Kenny Romanov**  
TrustMe
