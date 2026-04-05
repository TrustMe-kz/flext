# Flext File

[![Static Badge](https://img.shields.io/badge/GitHub-Star%20%281%29-yellow?logo=github)](https://github.com/TrustMe-kz/flext-file)
[![Static Badge](https://img.shields.io/badge/NPM-Download%20%281%29-blue)](https://www.npmjs.com/package/flext-file)

![trustme24_flext_cover.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_logo_cover.jpg)

**Flext File** is a portable file format and runtime adapter for moving Flext documents between systems.

In many document workflows, templates, assets, and metadata are stored as separate parts. This works at first, but over time it becomes difficult to move documents between services, open them in another environment, or reproduce the same result later. Flext File addresses this problem by packaging a document into a single `.flext` artifact and restoring it back into a runtime Flext object when needed.

A Flext File container can hold the template, a manifest, and related assets in one zip-based file. This makes documents easier to preview, transfer, store, and reopen across different parts of a document pipeline.

- [GitHub: TrustMe-kz/flext-file](https://github.com/TrustMe-kz/flext-file)
- [NPM: flext-file](https://www.npmjs.com/package/flext-file)
- [Documentation: Available at TrustMe Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE)

---

## Installation

```shell
npm i flext-file @trustme24/flext
```

🎉 **That's It!**

---

## The Problem

Document generation often depends on more than one file. A template may reference assets, metadata, or other runtime information that must stay aligned when the document is moved to another service or opened later.

Typical issues include: templates and assets being transferred separately, missing resource files, weak contracts between systems, and difficulty reproducing the same document outside the original environment.

![trustme24_flext_abstract_painting.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_abstract_painting.jpg)

### A few common scenarios illustrate the problem:

1. **A service generates a document, but the receiving side only gets part of the required files.**  
   Solution with Flext File: The document can be packed into one `.flext` container so template and assets travel together.

————————————

2. **A frontend needs to preview a prepared document without access to the original project structure.**  
   Solution with Flext File: The container can be opened directly and restored into a runtime Flext object for preview.

————————————

3. **A document must be stored and reopened later with predictable structure.**  
   Solution with Flext File: The file carries an explicit manifest and a stable internal layout instead of relying on implicit folder conventions.

---

## What It Provides

**Flext File** builds on top of [Flext](https://www.npmjs.com/package/@trustme24/flext) and acts as a companion format for portable document artifacts. The goal is not to replace Flext itself, but to give Flext-based workflows a standard file container for transport and reproduction.

Instead of treating a prepared document as a loose collection of files, Flext File treats it as a single structured artifact. A `.flext` file can include a template, a manifest, and related assets, all stored together inside a zip-based container.

This approach helps systems exchange prepared documents with a clearer contract and reopen them later without depending on the original project layout.

### Quick Start:

```ts
import FlextFile from 'flext-file';

const file = await FlextFile.from(arrayBuffer, true);

const html = file.data.html;
const css = await file.data.getCss();

document.body.innerHTML = html;
```

---

## Core Ideas

A **Flext File** container has two important roles. The first role is storage: it defines a portable `.flext` file that keeps the template and assets together. The second role is runtime recovery: the container can be deserialized back into a Flext object so existing Flext-based rendering flows can continue to work.

Keeping the document structure in one file makes it easier to move across services and reduces hidden assumptions about where assets or template parts are stored.

The internal structure is intentionally simple. A container includes a manifest, the template, and asset entries. The manifest describes where these parts are located and which format version the file uses.

### Example

```text
.
├── assets
│   └── cat.jpg
├── manifest.json
└── template.hbs
```

```json
{
  "v": "1.0",
  "template": "/template.hbs",
  "assets": {
    "cat": "/assets/cat.jpg"
  }
}
```

> 💡 **In this example** the container carries an explicit manifest and file map. This allows another environment to reopen the document with a predictable structure instead of guessing how the template and assets were originally arranged.

---

## Use Cases

![trustme24_flext_use_cases.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_use_cases.jpg)

**Flext File** is intended for structured document transport and reproduction. A common example is browser preview of a prepared `.flext` document uploaded by a user. It is also useful when a document must be transferred between services as one binary artifact, stored for later reopening, or distributed without exposing the original source project structure.

Flext File can be used on its own as a file format and adapter, but it is mainly designed to work inside the broader Flext ecosystem. It fits naturally into pipelines where Flext prepares a document and another application later previews, delivers, or processes that result.

Together these parts allow Flext-based systems to move documents more reliably while keeping the core document logic in Flext itself.

---

## Creating and Reading Files

**Flext File** is designed to keep the API small. In the most common path, a developer reads a file from an `ArrayBuffer`, restores it with `FlextFile.from(...)`, and then uses the recovered Flext object as usual.

### Example:

```ts
import FlextFile from 'flext-file';

const file = await FlextFile.from(arrayBuffer, true);

console.log(file.data.html);
console.log(await file.data.getCss());
```

The library also exposes methods for converting runtime data back into a binary artifact. This makes it possible to build storage, transfer, or download flows around the same format.

### Best practices

Treat `.flext` files as versioned document artifacts. Prefer explicit manifest-driven structure over ad hoc zip layouts. Keep preview logic isolated in the consumer application and test file flows with realistic templates and assets.

### Limitations

Flext File is intentionally focused. It is not a template engine, not a PDF renderer, not a WYSIWYG editor, and not a complete document management system. Its role is to act as a portable file layer for Flext-based document workflows.

Preview security is also outside the scope of the format itself. Applications that render HTML and CSS from a `.flext` file should define their own isolation and security model.

---

## API

The main entry point is the `FlextFile` class.

### Static method usage:

```ts
import FlextFile from 'flext-file';

await FlextFile.from(arrayBuffer, true);
```

The package also includes lower-level helpers for reading and writing buffers when a more controlled integration is needed.

[More information about the API is available at TrustMe Wiki](ttps://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE).

---

## Architecture

**Flext File** operates as a simple pipeline.

```text
Template / Assets
  v
Flext
  v
Flext File
  v
Flext
  v
Preview / Delivery / Storage
```

At runtime Flext File reads the container, parses the manifest, restores the template and assets, and rebuilds a Flext object. The recovered document can then be passed to other tools to display, store, or process further.

- [Repo: More information about the repo can be found in ARCHITECTURE.md](https://github.com/TrustMe-kz/flext-file/blob/main/ARCHITECTURE.md)
- [Documentation: More information about the API is available at TrustMe Wiki](https://trustmekz.atlassian.net/wiki/external/MTUwYzM5NjUzNDE4NDViMGJlMTliOWEzNzM1Y2RiZWE)

---

## Development

```shell
npm run test:app
```

[More information about contribution can be found in CONTRIBUTING.md](https://github.com/TrustMe-kz/flext-file/blob/main/CONTRIBUTING.md).

---

## Roadmap

Future development focuses on improving reliability and adoption. Planned areas include stronger format validation, clearer compatibility rules, better serialization and deserialization guarantees, richer documentation, ecosystem integrations, and more complete examples for browser and service-based workflows.

![trustme24_flext_abstract_painting.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_abstract_painting.jpg)

* **Contributions** are welcome. Useful areas include documentation, example integrations, validation improvements, compatibility testing, and test coverage. Changes that affect the file format or manifest semantics should first be discussed in issues so format decisions remain coherent.

————————————

* **Governance:** Flext File is maintained by [TrustMe](https://trustme24.com/). External contributions are encouraged while core format decisions remain centralized to keep the runtime and file contract consistent.

————————————

- **Security:** If you discover a security issue, please report it privately to [i.am@kennyromanov.com](mailto:i.am@kennyromanov.com) instead of opening a public issue

————————————

* **License:** Flext File is released under the [MIT License](https://github.com/TrustMe-kz/flext-file/blob/main/LICENSE)

---

**Flext File by Kenny Romanov**  
TrustMe
