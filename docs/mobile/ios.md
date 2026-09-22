# iOS Standard (`mobile/ios/`)

Building the app requires macOS with Xcode. CI builds it on a macOS runner.
The bundle identifier is `com.mustafagokselgokmen.ios`.

## Stack

- Swift 6 with strict concurrency checking
- SwiftUI, targeting iOS 17 or later (required for `@Observable`)
- async/await. New code doesn't use Combine.
- Networking: `swift-openapi-generator`, `swift-openapi-runtime` and `swift-openapi-urlsession`
  (a URLSession transport)
- Sign-in: `GoogleSignIn-iOS`, Google's official SDK
- Swift Package Manager
- Keychain, through the Security framework
- No other third-party libraries for networking or authentication

## Layout

```
<App>/
├── App/                 <App>App.swift, AppDependencies (composition root), RootView
├── Features/Auth/       SignInView, SignInViewModel, AuthRepository
├── Features/Contact/    ContactView, ContactViewModel, ContactMessageRepository (protocol + live),
│                        ContactMessage (domain)
├── Core/
│   ├── Networking/      openapi.yaml (symlink), openapi-generator-config.yaml, AuthMiddleware,
│   │                    error mapping
│   ├── Auth/            TokenStore (Keychain), SessionStore
│   └── UI/              shared views
<App>Tests/
<App>UITests/
```

## MVVM rules

**View**
- No networking, no business logic, no generated types.
- Owns its ViewModel with `@State` and triggers loading with `.task { await viewModel.load() }`.
- Every view has a `#Preview` backed by a fake repository.

**ViewModel**
- One per screen, declared as `@MainActor @Observable final class`.
- Exposes its screen state as `private(set) var state`.
- Has one method per user intent. Methods that load data are `async`.
- Receives repository protocols through `init`. No singletons: everything is wired together in
  `AppDependencies`.

**Repository**
- Wraps the generated `Client`.
- Maps `Components.Schemas.*` types to `Sendable` domain structs.
- Throws an `AppError` chosen from the Problem `code`. The cases are `network`, `unauthorized`,
  `notFound`, `validation([FieldError])`, `conflict`, `rateLimited(retryAfter:)` and `unknown`.

## Sign-in and tokens

- **Getting a Google ID token:** `AuthRepository` calls
  `GIDSignIn.sharedInstance.signIn(withPresenting:)` and takes `idToken.tokenString`.
- **Exchanging it:** the token is sent to `POST /api/v1/auth/google`, and the returned token pair is
  stored in the Keychain.
- **Configuration:**
  - The iOS OAuth client ID and its reversed-client-ID URL scheme are set in `Info.plist`, with
    values taken from the xcconfig.
  - The backend's `GOOGLE_CLIENT_IDS` must include the iOS client ID.
- **Adding the token to requests:** an `AuthMiddleware` (a `ClientMiddleware`) adds the Bearer
  token.
- **Refreshing after a 401:**
  - The middleware refreshes once. The refresh runs through an `actor`, so concurrent requests
    share a single refresh.
  - It then retries the original request once.
  - If the refresh fails, it clears the Keychain, and `SessionStore` switches the root view to
    sign-in.
- **Token storage:** tokens are kept only in the Keychain ([security.md](../security.md#token-storage)).
- **App Store:** publishing the app would require an additional login option that meets App Review
  Guideline 4.8 ([ADR-006](../decisions/006-google-sign-in.md)).

## Networking

- **Base URL:** comes from an xcconfig for each build configuration. The simulator uses
  `http://localhost:8080`.
- **ATS:** the exception for plain HTTP exists only in the Debug configuration.

## Code generation

- **Plugin:** the SPM build plugin `OpenAPIGenerator`.
- **`openapi-generator-config.yaml`:**
  - `generate: [types, client]`
  - `accessModifier: internal`
- **The spec file:** `Core/Networking/openapi.yaml` is a symlink to `contract/openapi.yaml`. It is
  never a copy.
