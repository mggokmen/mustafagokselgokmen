"""Schemathesis hooks: sign in through the mock identity provider, so protected operations are
called with a real access token. Works against every backend implementation."""

import os

import requests
import schemathesis

API_URL = os.environ["API_URL"]
IDP_URL = os.environ["IDP_URL"]


@schemathesis.auth()
class ContractTestUser:
    def get(self, case, ctx):
        # The mock provider requires client authentication but doesn't check the password.
        id_token = requests.post(
            f"{IDP_URL}/token",
            data={"grant_type": "client_credentials", "scope": "user"},
            auth=("contract-tests", ""),
            timeout=10,
        ).json()["access_token"]
        response = requests.post(
            f"{API_URL}/api/v1/auth/google", json={"idToken": id_token}, timeout=10
        )
        response.raise_for_status()
        return response.json()["accessToken"]

    def set(self, case, data, ctx):
        case.headers = case.headers or {}
        case.headers["Authorization"] = f"Bearer {data}"
