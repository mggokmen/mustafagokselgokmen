# Sign-in with Google, token rotation, logout and roles.
# Runs unchanged against every backend implementation (docs/testing.md#contract-tests).
# Variables: api = API base URL, idp = issuer URL of the mock identity provider.
# The mock provider requires client authentication but doesn't check the password.


# --- Sign-in -----------------------------------------------------------------------------------

# Google ID token for a regular user.
POST {{idp}}/token
[BasicAuth]
contract-tests:
[Form]
grant_type: client_credentials
scope: user
[Options]
retry: 30
HTTP 200
[Captures]
user_id_token: jsonpath "$.access_token"

POST {{api}}/api/v1/auth/google
{
  "idToken": "{{user_id_token}}"
}
HTTP 200
[Asserts]
jsonpath "$.tokenType" == "Bearer"
jsonpath "$.expiresIn" == 900
jsonpath "$.accessToken" isString
jsonpath "$.refreshToken" isString
[Captures]
access_token: jsonpath "$.accessToken"
first_refresh_token: jsonpath "$.refreshToken"

GET {{api}}/api/v1/auth/me
Authorization: Bearer {{access_token}}
HTTP 200
[Asserts]
jsonpath "$.email" == "user@example.com"
jsonpath "$.name" == "Contract User"
jsonpath "$.role" == "USER"
jsonpath "$.id" isString


# --- Rejected credentials: 401 ProblemDetail ---------------------------------------------------

GET {{api}}/api/v1/auth/me
HTTP 401
[Asserts]
header "Content-Type" contains "application/problem+json"
jsonpath "$.status" == 401
jsonpath "$.code" == "UNAUTHENTICATED"

GET {{api}}/api/v1/auth/me
Authorization: Bearer not-an-access-token
HTTP 401
[Asserts]
jsonpath "$.code" == "UNAUTHENTICATED"

POST {{api}}/api/v1/auth/google
{
  "idToken": "not-a-google-id-token"
}
HTTP 401
[Asserts]
header "Content-Type" contains "application/problem+json"
jsonpath "$.code" == "UNAUTHENTICATED"

# Google ID token whose email is not verified.
POST {{idp}}/token
[BasicAuth]
contract-tests:
[Form]
grant_type: client_credentials
scope: unverified
HTTP 200
[Captures]
unverified_id_token: jsonpath "$.access_token"

POST {{api}}/api/v1/auth/google
{
  "idToken": "{{unverified_id_token}}"
}
HTTP 401
[Asserts]
jsonpath "$.code" == "UNAUTHENTICATED"


# --- Validation: 400 ProblemDetail -------------------------------------------------------------

POST {{api}}/api/v1/auth/google
{}
HTTP 400
[Asserts]
header "Content-Type" contains "application/problem+json"
jsonpath "$.code" == "VALIDATION_FAILED"
jsonpath "$.errors[0].field" == "idToken"


# --- Refresh token rotation and reuse detection ------------------------------------------------

POST {{api}}/api/v1/auth/refresh
{
  "refreshToken": "{{first_refresh_token}}"
}
HTTP 200
[Asserts]
jsonpath "$.refreshToken" != "{{first_refresh_token}}"
[Captures]
second_refresh_token: jsonpath "$.refreshToken"
rotated_access_token: jsonpath "$.accessToken"

GET {{api}}/api/v1/auth/me
Authorization: Bearer {{rotated_access_token}}
HTTP 200

# Presenting the rotated token again is reuse: it fails...
POST {{api}}/api/v1/auth/refresh
{
  "refreshToken": "{{first_refresh_token}}"
}
HTTP 401
[Asserts]
jsonpath "$.code" == "UNAUTHENTICATED"

# ...and revokes the whole family, including the newest token.
POST {{api}}/api/v1/auth/refresh
{
  "refreshToken": "{{second_refresh_token}}"
}
HTTP 401


# --- Logout ------------------------------------------------------------------------------------

POST {{api}}/api/v1/auth/google
{
  "idToken": "{{user_id_token}}"
}
HTTP 200
[Captures]
session_refresh_token: jsonpath "$.refreshToken"

POST {{api}}/api/v1/auth/logout
{
  "refreshToken": "{{session_refresh_token}}"
}
HTTP 204

POST {{api}}/api/v1/auth/refresh
{
  "refreshToken": "{{session_refresh_token}}"
}
HTTP 401

# Logout is idempotent.
POST {{api}}/api/v1/auth/logout
{
  "refreshToken": "{{session_refresh_token}}"
}
HTTP 204


# --- Roles -------------------------------------------------------------------------------------

POST {{idp}}/token
[BasicAuth]
contract-tests:
[Form]
grant_type: client_credentials
scope: admin
HTTP 200
[Captures]
admin_id_token: jsonpath "$.access_token"

POST {{api}}/api/v1/auth/google
{
  "idToken": "{{admin_id_token}}"
}
HTTP 200
[Captures]
admin_access_token: jsonpath "$.accessToken"

GET {{api}}/api/v1/auth/me
Authorization: Bearer {{admin_access_token}}
HTTP 200
[Asserts]
jsonpath "$.role" == "ADMIN"
