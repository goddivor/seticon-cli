## Description

Briefly describe what this PR changes and why.

Closes #<!-- issue number, if applicable -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Documentation only
- [ ] Refactor / chore (no functional change)

## Platforms tested

- [ ] Windows
- [ ] macOS
- [ ] Linux (GNOME family)
- [ ] Linux (KDE family)

## Checklist

- [ ] My branch targets `dev` (not `main` directly)
- [ ] Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) format (`feat:`, `fix:`, `docs:`, `chore:`, ...)
- [ ] `node --check seticon.js` passes (valid ESM syntax)
- [ ] `npm pack --dry-run` does not include unintended files
- [ ] I tested the change manually on at least one platform
- [ ] Documentation (README / help text) updated if behavior changed

## How to test

Steps a reviewer can follow to verify the change:

```bash
node seticon.js set -f ./test-folder -i ./test.png
```

## Additional notes

Anything else reviewers should know.
