# Sending contact messages, role-scoped listing and the status workflow.
# Runs unchanged against every backend implementation (docs/testing.md#contract-tests).
# Variables: api = API base URL, idp = issuer URL of the mock identity provider.


# --- Sign in as a user and as an admin ---------------------------------------------------------

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
[Captures]
user_token: jsonpath "$.accessToken"

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
admin_token: jsonpath "$.accessToken"


# --- A user sends a message --------------------------------------------------------------------

POST {{api}}/api/v1/contact-messages
Authorization: Bearer {{user_token}}
{
  "subject": "Contract scenario",
  "message": "Sent by the contract tests."
}
HTTP 201
[Asserts]
header "Location" exists
jsonpath "$.status" == "NEW"
jsonpath "$.version" == 0
jsonpath "$.subject" == "Contract scenario"
jsonpath "$.author.email" == "user@example.com"
[Captures]
message_id: jsonpath "$.id"

GET {{api}}/api/v1/contact-messages/{{message_id}}
Authorization: Bearer {{user_token}}
HTTP 200
[Asserts]
jsonpath "$.id" == "{{message_id}}"

GET {{api}}/api/v1/contact-messages?q=contract%20scenario
Authorization: Bearer {{user_token}}
HTTP 200
[Asserts]
jsonpath "$.items[0].id" == "{{message_id}}"
jsonpath "$.page" == 0
jsonpath "$.totalItems" >= 1


# --- Validation and authentication -------------------------------------------------------------

POST {{api}}/api/v1/contact-messages
Authorization: Bearer {{user_token}}
{
  "subject": "   ",
  "message": "Blank subject"
}
HTTP 400
[Asserts]
jsonpath "$.code" == "VALIDATION_FAILED"
jsonpath "$.errors[0].field" == "subject"

GET {{api}}/api/v1/contact-messages?sort=message,asc
Authorization: Bearer {{user_token}}
HTTP 400
[Asserts]
jsonpath "$.code" == "VALIDATION_FAILED"
jsonpath "$.errors[0].field" == "sort"

POST {{api}}/api/v1/contact-messages
{
  "subject": "No token",
  "message": "Should be rejected"
}
HTTP 401
[Asserts]
jsonpath "$.code" == "UNAUTHENTICATED"


# --- Only admins change the status -------------------------------------------------------------

PUT {{api}}/api/v1/contact-messages/{{message_id}}/status
Authorization: Bearer {{user_token}}
{
  "status": "IN_PROGRESS",
  "version": 0
}
HTTP 403
[Asserts]
jsonpath "$.code" == "FORBIDDEN"

PUT {{api}}/api/v1/contact-messages/{{message_id}}/status
Authorization: Bearer {{admin_token}}
{
  "status": "IN_PROGRESS",
  "version": 0
}
HTTP 200
[Asserts]
jsonpath "$.status" == "IN_PROGRESS"
jsonpath "$.version" == 1

# A stale version loses against the change that already happened.
PUT {{api}}/api/v1/contact-messages/{{message_id}}/status
Authorization: Bearer {{admin_token}}
{
  "status": "RESOLVED",
  "version": 0
}
HTTP 409
[Asserts]
jsonpath "$.code" == "CONFLICT"

PUT {{api}}/api/v1/contact-messages/{{message_id}}/status
Authorization: Bearer {{admin_token}}
{
  "status": "RESOLVED",
  "version": 1
}
HTTP 200
[Asserts]
jsonpath "$.status" == "RESOLVED"

# The workflow never goes back to NEW.
PUT {{api}}/api/v1/contact-messages/{{message_id}}/status
Authorization: Bearer {{admin_token}}
{
  "status": "NEW",
  "version": 2
}
HTTP 409
[Asserts]
jsonpath "$.code" == "CONFLICT"


# --- Admins see every message, users only their own ---------------------------------------------

# The admin sees a message another user wrote.
GET {{api}}/api/v1/contact-messages?status=RESOLVED&q=Contract%20scenario
Authorization: Bearer {{admin_token}}
HTTP 200
[Asserts]
jsonpath "$.items[0].id" == "{{message_id}}"
jsonpath "$.items[0].author.email" == "user@example.com"

GET {{api}}/api/v1/contact-messages/00000000-0000-4000-8000-000000000000
Authorization: Bearer {{user_token}}
HTTP 404
[Asserts]
jsonpath "$.code" == "NOT_FOUND"
