# Git Standards

## Branches

| Branch | Purpose | Created from | Merged into |
|---|---|---|---|
| `main` | Released code; every commit is a tagged release | — | — |
| `develop` | Integration branch; always builds and passes tests | `main` | `main` |
| `feature/<description>` | New functionality | `develop` | `develop` |
| `fix/<description>` | Bug fixes | `develop` | `develop` |
| `refactor/<description>` | Changes to structure without changes in behavior | `develop` | `develop` |
| `release/<version>` | Sets the release version before a release | `develop` | `develop` |

- Branch names are short kebab-case descriptions, for example `feature/contact-form` or
  `fix/refresh-token-reuse`.
- `main` and `develop` are protected:
  - no direct commits
  - no force pushes
  - changes arrive only through pull requests with passing checks

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body: what changed and why>

<footer: BREAKING CHANGE: ..., Refs #42>
```

| Type | Use |
|---|---|
| `feat` | New functionality |
| `fix` | Bug fix |
| `refactor` | Changes to structure without changes in behavior |
| `test` | Adding or changing tests only |
| `docs` | Documentation only |
| `chore` | Build, tooling, dependencies, CI |

- **Scope** is one of `contract`, `spring-boot`, `nextjs`, `android`, `ios`, `docs`, `ci`, or the
  name of an alternative backend.
- **Subject:**
  - imperative mood, lowercase, no trailing period
  - at most 72 characters
  - example: `feat(contract): add contact message status endpoint`
- **Body** explains *why* when that isn't obvious from the subject.
- **Breaking changes** are marked with `!` after the type or scope, plus a `BREAKING CHANGE:` footer.
- **One logical change per commit.** A commit leaves the build working.

## Pull requests

- **Scope:** one concern per pull request, targeting `develop`. A change to the contract and its
  implementation may ship together.
- **The description contains:**
  - what changed and why
  - breaking changes (or "none")
  - how it was tested
  - linked issues
- **Before merging:**
  - CI passes
  - the [Definition of Done](../AGENTS.md#definition-of-done) is met
  - review comments are resolved
- **Size:** small enough to review in one sitting. Split large changes.

## Merge strategy

- **Into `develop`:** squash merge. The pull request title becomes the commit message, so it follows
  the commit format above.
- **Release, from `develop` into `main`:**
  - a merge commit
  - tagged `vMAJOR.MINOR.PATCH` according to [SemVer](https://semver.org/)
  - a breaking API change increments MAJOR
- Branches are deleted after they are merged.

## Releasing

1. On a `release/X.Y.Z` branch, set the application versions to `X.Y.Z` (for example
   `backend/spring-boot/pom.xml`), then merge it into `develop`.
2. Open a pull request from `develop` into `main`. Merge it with a merge commit once CI is green.
3. After CI on `main` is green, tag the merge commit `vX.Y.Z` and push the tag. `release.yml`
   publishes the images ([devops.md](devops.md#continuous-delivery)).
4. Create a GitHub Release for the tag. Its notes state what the version contains and what it
   doesn't contain yet.
5. On `develop`, move the versions to the next `-SNAPSHOT`.
