# Contributing to seticon-cli

Thanks for your interest in contributing! `seticon-cli` is a small, dependency-light
cross-platform CLI to change folder icons on Windows, macOS and Linux. This guide
explains how to set up the project and submit changes.

## Prerequisites

- **Node.js** >= 18.17.0
- The project is **ESM only** (`import`/`export`, no `require`)
- Runtime dependencies: [`sharp`](https://www.npmjs.com/package/sharp) and
  [`png-to-ico`](https://www.npmjs.com/package/png-to-ico) (used only on Windows for
  PNG → ICO conversion)

## Getting started

```bash
git clone https://github.com/goddivor/seticon-cli.git
cd seticon-cli
npm install

# Run locally
node seticon.js --help
node seticon.js set -f ./test-folder -i ./test.png
```

## Branching model

- **`main`** is protected — it always reflects the published, stable state.
  Direct pushes are blocked; all changes land through a Pull Request.
- **`dev`** is the integration branch for ongoing work.

Create your topic branch off `dev`, and open your PR against `dev`:

```bash
git checkout dev
git pull
git checkout -b fix/short-description
```

## Coding conventions

- **ESM only** — use `import`/`export`, never `require`.
- **Dynamic imports** for `sharp` and `png-to-ico` (loaded on demand, not at startup).
- **No comments** unless the *why* is genuinely non-obvious. Prefer clear names and
  small functions over explanatory comments.
- Keep the CLI dependency-light — discuss before adding a new runtime dependency.
- Preserve cross-platform behavior: any change to icon handling should be considered
  for Windows, macOS, and Linux (GNOME + KDE).

Before opening a PR:

```bash
node --check seticon.js     # valid ESM syntax
npm pack --dry-run          # no unintended files in the tarball
```

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/),
in English, imperative mood:

```
type(scope): description
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `revert`.

Examples:

```
feat(linux): detect XDG_CURRENT_DESKTOP before applying methods
fix(windows): keep desktop.ini hidden after icon change
docs(readme): clarify supported icon formats per platform
```

Do **not** add `Co-Authored-By` or "Generated with" signatures.

## Pull requests

- Target the **`dev`** branch.
- Fill in the PR template (type of change, platforms tested, checklist).
- Test your change manually on at least one platform and say which one.
- Keep PRs focused — one logical change per PR.

## Reporting bugs and requesting features

Open an issue using the **Bug report** or **Feature request** template. For bugs,
please include your OS, desktop environment (on Linux), Node.js version, the icon
format you used, and the full terminal output.

## Releases (maintainers only)

Releases are published to npm by the maintainer:

1. `npm version patch|minor|major` on `main` (after the PR is merged)
2. `npm publish --access public`
3. `git push origin main --tags` and create a GitHub Release for the new tag

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](../LICENSE).
