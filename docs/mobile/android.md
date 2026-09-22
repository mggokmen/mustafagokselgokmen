# Android Standard (`mobile/android/`)

## Stack

- **Language and UI:** Kotlin; Jetpack Compose with Material 3; a single activity
- **Navigation:** Jetpack Navigation with type-safe (`@Serializable`) routes
- **Dependency injection:** Hilt
- **Networking:** Retrofit, OkHttp and kotlinx.serialization, with the client generated from the
  contract
- **Concurrency:** Coroutines and Flow
- **Sign-in:** Credential Manager (`androidx.credentials`) with Sign in with Google
  (`googleid`)
- **Storage:** Room as a local cache, DataStore
- **Build:** Gradle Kotlin DSL with a version catalog (`gradle/libs.versions.toml`)

## Layout: one `app` module, packaged by feature

`applicationId` and `namespace` are both `com.mustafagokselgokmen.android`.

```
app/src/main/java/com/mustafagokselgokmen/android/
├── feature/auth/
│   ├── ui/     SignInRoute, SignInScreen, SignInViewModel, SignInUiState
│   └── data/   AuthRepository, GoogleSignInClient (Credential Manager wrapper)
├── feature/contact/
│   ├── ui/     ContactRoute, ContactScreen, ContactViewModel, ContactUiState
│   └── data/   ContactMessageRepository (interface), DefaultContactMessageRepository,
│               ContactMessage (domain), mappers
├── core/
│   ├── network/    OkHttp/Retrofit setup, AuthInterceptor, TokenAuthenticator, error mapping
│   ├── database/   Room database, DAOs, entities
│   ├── auth/       TokenStore, SessionManager
│   └── ui/         theme, shared composables
└── App.kt (@HiltAndroidApp), MainActivity.kt, AppNavHost.kt
```

Split into more Gradle modules only when a specific build or boundary problem requires it.

## MVVM rules

**Compose UI**
- Each screen has two composables:
  - `XxxRoute` gets the ViewModel with `hiltViewModel()` and collects its state with
    `collectAsStateWithLifecycle()`.
  - `XxxScreen(state, onAction)` is stateless and has a `@Preview`.
- Composables never call repositories and never start network work.

**ViewModel**
- Exposes exactly one `StateFlow<XxxUiState>`, backed by a private `MutableStateFlow` that is
  changed only through `update { }`.
- User intents arrive as method calls, or through a single `onAction(XxxAction)`.
- One-off effects, such as a "message sent" notice, are fields in the state. The UI clears them
  after handling them. No `Channel` or `SharedFlow` event streams.
- Never imports Retrofit, generated API models, Room, `Context` or Compose.

**Repository**
- Its interface lives in `feature/*/data`.
- Returns domain models: `suspend` functions for one-shot operations, `Flow` for data the UI
  observes.
- Returns `Result<T>`. A failure is an `AppError` subtype chosen from the Problem `code`:
  - `Network`
  - `Unauthorized`
  - `NotFound`
  - `Validation(fieldErrors)`
  - `Conflict`
  - `RateLimited(retryAfter)`
  - `Unknown`
- Dispatchers are injected, never hardcoded.

## Local cache (Room)

- Room is added only when the first feature that needs offline data or caching is built. Contact
  messages don't need it for the MVP.
- Once Room is added, it becomes the single source of truth for that feature: the UI observes Room,
  and the network refreshes it.

## Sign-in and tokens

- **Getting the Google ID token:**
  - `GoogleSignInClient` asks Credential Manager for a Sign in with Google credential.
  - `serverClientId` is the **web** OAuth client ID, taken from `BuildConfig`. That makes the ID
    token's audience one the backend accepts.
- **Google Cloud setup:** the Android OAuth client is registered with the app's package name and
  the SHA-1 fingerprint of its signing certificate. There is one fingerprint each for debug and
  release.
- **Exchanging the token:** `AuthRepository` sends the ID token to `POST /api/v1/auth/google` and
  stores the returned token pair in `TokenStore`.
- **Token storage:** DataStore, encrypted with an Android Keystore key through Tink
  ([security.md](../security.md#token-storage)).
- **Using the token:** `AuthInterceptor` adds the Bearer token to each request.
- **Refreshing:** an OkHttp `Authenticator` refreshes the token on a 401.
  - Only one refresh runs at a time; concurrent 401s wait for it.
  - The failed request is retried once.
  - If the refresh fails, the tokens are cleared, and `SessionManager` emits a logged-out state that
    sends the user back to sign-in.

## Networking

- **Base URL:** comes from `BuildConfig`, set per build type. The emulator reaches the development
  machine at `http://10.0.2.2:8080`.
- **Cleartext HTTP:** allowed only through the debug network security config.
- **JSON:** configured with `ignoreUnknownKeys = true` and `explicitNulls = false`, so a new
  response field never breaks the app ([api.md](../api.md#compatibility)).

## Code generation

openapi-generator Gradle plugin:
- `inputSpec`: `$rootDir/../../contract/openapi.yaml`
- `generatorName`: `kotlin`
- `packageName`: `com.mustafagokselgokmen.android.core.network.generated`
- `library`: `jvm-retrofit2`
- `serializationLibrary`: `kotlinx_serialization`
- `useCoroutines`: `true`

The output is written to the build directory and registered as a source set generated before
compilation. Generated interfaces and models are used only in `data/` and `core/network/`.
