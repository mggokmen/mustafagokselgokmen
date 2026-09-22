# ADR-005: MVVM with repositories on Android and iOS

- Status: Accepted
- Date: 2026-09-22

## Context

The same product is built natively twice, in Kotlin with Jetpack Compose and in Swift with SwiftUI.
Features should carry over from one platform to the other with little translation. The business
logic in the apps should be testable without UI.

## Decision

Both apps use the same layers:

```
View (Compose / SwiftUI)  →  ViewModel  →  Repository  →  API (generated client)
```

- **ViewModel:** one per screen, exposing a single immutable UI state.
- **Views:** render that state and forward user intents.
- **Repositories:**
  - wrap the generated API client
  - map API models to domain models
  - map errors to typed app errors
  - own caching

Details: [android.md](../mobile/android.md), [ios.md](../mobile/ios.md).

## Alternatives considered

- **MVI / unidirectional stores:** more ceremony per screen, and no benefit at this app's size.
- **The Composable Architecture (iOS):** a large third-party dependency, and no equivalent on
  Android, which breaks the one-to-one mapping between platforms.
- **Logic in views:** can't be tested without UI tests.

## Consequences

- A feature has the same shape on both platforms, which makes cross-platform work predictable.
- ViewModels and repositories are covered by fast unit tests.
- Generated API code stays inside repositories, so changes to the contract don't ripple into the UI.
- Simple screens carry some structural boilerplate.
