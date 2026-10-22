"""Minimal Supabase REST (PostgREST) and Storage client."""

from typing import Any

import httpx


class Supabase:
    def __init__(self, url: str, service_role_key: str, client: httpx.Client | None = None):
        self._url = url
        self._http = client or httpx.Client(timeout=60)
        self._headers = {"apikey": service_role_key, "Authorization": f"Bearer {service_role_key}"}

    def _check(self, response: httpx.Response) -> httpx.Response:
        if response.is_error:
            raise RuntimeError(f"Supabase {response.request.method} {response.request.url.path} failed: "
                               f"{response.status_code} {response.text[:300]}")
        return response

    def rpc(self, function: str, values: dict) -> dict:
        response = self._http.post(f"{self._url}/rest/v1/rpc/{function}", json=values, headers=self._headers)
        return self._check(response).json()

    def select(self, table: str, params: dict[str, str]) -> list[dict[str, Any]]:
        response = self._http.get(f"{self._url}/rest/v1/{table}", params=params, headers=self._headers)
        return self._check(response).json()

    def upsert(self, table: str, row: dict[str, Any], on_conflict: str) -> dict[str, Any]:
        """Insert or update one row; only the keys present in `row` are written on conflict."""
        response = self._http.post(
            f"{self._url}/rest/v1/{table}",
            params={"on_conflict": on_conflict},
            json=row,
            headers={**self._headers, "Prefer": "resolution=merge-duplicates,return=representation"},
        )
        return self._check(response).json()[0]

    def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        response = self._http.post(f"{self._url}/rest/v1/{table}", json=row,
                                   headers={**self._headers, "Prefer": "return=representation"})
        return self._check(response).json()[0]

    def update(self, table: str, match: dict[str, str], values: dict[str, Any]) -> None:
        params = {key: f"eq.{value}" for key, value in match.items()}
        self._check(self._http.patch(f"{self._url}/rest/v1/{table}", params=params, json=values,
                                     headers=self._headers))

    def upload_text(self, bucket: str, path: str, text: str) -> None:
        response = self._http.post(
            f"{self._url}/storage/v1/object/{bucket}/{path}",
            content=text.encode(),
            headers={**self._headers, "Content-Type": "text/markdown; charset=utf-8", "x-upsert": "true"},
        )
        self._check(response)

    def delete(self, table: str, params: dict[str, str]) -> None:
        self._check(self._http.delete(f"{self._url}/rest/v1/{table}", params=params, headers=self._headers))

    def create_confirmed_user(self, email: str) -> bool:
        """Create an Auth user whose email counts as confirmed (no password: sign-in is by emailed link).
        Returns False when the user already exists."""
        response = self._http.post(f"{self._url}/auth/v1/admin/users", json={"email": email, "email_confirm": True},
                                   headers=self._headers)
        if response.status_code == 422 and "email_exists" in response.text:
            return False
        self._check(response)
        return True
