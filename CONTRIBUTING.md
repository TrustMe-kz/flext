# Contributing — Flext

[< README.md](https://github.com/TrustMe-kz/flext/blob/main/README.md)

![trustme24_flext_cover.jpg](https://raw.githubusercontent.com/TrustMe-kz/flext/ae3284e6156dd8b18e1998084943636e50cd64a2/docs/trustme24_flext_logo_cover.jpg)

Thank you for contributing to **Flext**.

This file explains the practical side of contribution: what kinds of changes are welcome, how to prepare a pull request, and what maintainers expect before review.

If you are new to the project, read [README.md](https://github.com/TrustMe-kz/flext/blob/main/README.md) and [ARCHITECTURE.md](https://github.com/TrustMe-kz/flext/blob/main/ARCHITECTURE.md) first. This file assumes you already understand what Flext is and how the codebase is organized.

> 💡 **Important:** this repository contains two packages: `core/` for `@flext/core` and `main/` for `@trustme24/flext`. Run commands inside the affected package.

---

## 1. What contributions are welcome

Useful contributions include bug fixes, documentation improvements, example templates, test coverage, performance improvements that preserve behavior, and new modules that extend Flext without changing core semantics.

Changes that affect syntax, public API, built-in module behavior, or other stability-sensitive parts should be discussed in an issue before implementation.

---

## 2. What usually needs discussion first

Open an issue before starting if your change does any of the following:

* Changes FlextDoc syntax or directive behavior
* Changes public API behavior or signatures
* Changes semantics of built-in modules such as `put`, `math`, `cond`, or `match`
* Introduces a new directive
* Performs a large refactor across multiple parts of the system

This saves time for both contributors and maintainers.

---

## 3. What usually will not be accepted

The following kinds of changes are usually rejected:

* Breaking behavior changes without prior discussion
* Large formatting-only pull requests
* Architecture rewrites that were not requested
* Framework-specific logic added to the Flext core
* Heavy new dependencies without strong justification
* Unrelated cleanup mixed into a functional PR

> 💡 **Keep changes focused** and easy to review.

---

## 4. Before you start

Before writing code, check existing issues and confirm that the problem has not already been discussed. For anything larger than a small fix, open an issue first and confirm direction with maintainers.

Prefer the smallest useful change. In Flext, small diffs are much easier to review and much less likely to introduce regressions.

---

## 5. Development Setup

Clone the repository and work inside the affected package directory.

### 5.1 If the change belongs to Core

Use `core/` when the change affects parsing, metadata extraction, modules, model generation, validation, rendering, or shared runtime types/helpers.

```shell
cd core
npm install
npm run build
npm run test
```

### 5.2 If the change belongs to the main package

Use `main/` when the change affects the `Flext` wrapper, bundled dialects, compatibility behavior of the main package, CLI commands, or dialect distribution scripts.

```shell
cd main
npm install
npm run build
npm run test
```

If you need to **inspect behavior interactively** for the main package, you can also run:

```shell
cd main
npm run test:app
```

> ⚠️ **Do not edit** package `dist/` directories manually. Source of truth is package-local `src/`.

---

## 6. Contribution Workflow

The normal workflow is simple:

1. Fork the repository
2. Create a branch for your change
3. Choose the smallest relevant package boundary: `core/`, `main/`, or both if the main package must adapt to a Core change
4. Implement the change in the smallest relevant area
5. Add or update tests
6. Run tests and build in every affected package
7. Open a pull request with a clear description

A good pull request explains three things clearly: what problem it solves, which package was changed, and whether any user-visible behavior changed.

---

## 7. Choosing the Right Package

Use this rule of thumb before editing code:

* Choose `core/` for parser behavior, directives, model generation, validation, rendering, modules, shared runtime types, and base dialect primitives
* Choose `main/` for the public `Flext` wrapper, bundled dialect classes, `@syntax`-driven dialect selection, CLI commands, and dialect build/sync tooling
* Choose both packages only when a Core change must be surfaced or adapted in the main package

Do not put distribution behavior into Core. Do not put processing semantics into the main package unless it is dialect- or package-specific.

---

## 8. Pull Request Expectations

Each pull request should solve one clear problem. Keep the diff small, avoid unrelated refactoring, and match the existing code style.

If behavior changes, add or update tests. If examples or public behavior change, update documentation too. README examples and public API examples are part of the project contract and should stay accurate.

Before opening a PR, review your own diff and remove accidental formatting changes or unrelated edits.

---

## 9. Tests & Verification

Behavior changes should be covered by tests. This is especially important for parser logic, directive handling, model generation, validation, and built-in modules.

Run the full checks in every affected package before submitting.

### Core change

```shell
cd core
npm run build
npm run test
```

### Main package change

```shell
cd main
npm run build
npm run test
```

### Change touching both packages

```shell
cd core && npm run build && npm run test
cd main && npm run build && npm run test
```

> ⚠️ Do not remove or weaken tests just to make a change pass. If a fragile area is affected, add regression coverage.

---

## 10. Modules, Templates, & Docs

When possible, prefer extending Flext through modules instead of expanding core behavior. New modules usually belong in `core/` and should have clear behavior, examples, and tests.

Template-related contributions should keep templates declarative and predictable. Documentation contributions are welcome, especially when they improve clarity, examples, or explain real usage patterns better.

If you change package responsibilities, public API boundaries, dialect behavior, or developer workflow, update both [ARCHITECTURE.md](https://github.com/TrustMe-kz/flext/blob/main/ARCHITECTURE.md) and this file together.

---

## 11. Review & Communication

Maintainers review pull requests when time allows. Some PRs may need revisions before merge. Not every contribution will be accepted, especially if it conflicts with the long-term direction or stability of the project.

Keep communication technical, clear, and respectful. If a change is discussed in an issue first, the review process is usually faster.

---

## 12. Practical Checklist

Before opening a pull request, make sure that:

* The change solves one clear problem
* The diff is limited to relevant files
* The correct package boundary was chosen (`core/`, `main/`, or both)
* Tests were added or updated if needed
* `npm run test` passes in every affected package
* `npm run build` passes in every affected package
* Docs/examples were updated if behavior changed
* The PR description explains the reason for the change

🎉 **Thanks for helping improve Flext.**

---

**Flext by Kenny Romanov**  
TrustMe
