"""Tests for simplified signup + /teams/public + /profile/join-team."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@spartans.com", "password": "Spartan123!"}
MEMBER = {"email": "member@spartans.com", "password": "Member123!"}


def _login(session, creds):
    r = session.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    if tok:
        session.headers.update({"Authorization": f"Bearer {tok}"})
    return data


@pytest.fixture
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, ADMIN)
    return s


@pytest.fixture
def member_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    _login(s, MEMBER)
    return s


class TestSimplifiedRegister:
    def test_register_minimal_payload(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"TEST_reg_{uuid.uuid4().hex[:8]}@spartans.com"
        payload = {"email": email, "password": "Passw0rd!", "name": "New User", "phone": "9999999999"}
        r = s.post(f"{API}/auth/register", json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert "user" in body or "email" in body
        # Verify login works
        r2 = requests.post(f"{API}/auth/login", json={"email": email, "password": "Passw0rd!"}, timeout=15)
        assert r2.status_code == 200


class TestTeamsPublic:
    def test_requires_auth(self):
        r = requests.get(f"{API}/teams/public", timeout=15)
        assert r.status_code in (401, 403)

    def test_member_can_list_teams(self, member_session):
        r = member_session.get(f"{API}/teams/public", timeout=15)
        assert r.status_code == 200, r.text
        teams = r.json()
        assert isinstance(teams, list)
        # Ensure no _id leak
        for t in teams:
            assert "_id" not in t
            assert "team_id" in t and "name" in t


class TestJoinTeam:
    def test_join_team_updates_user(self, member_session, admin_session):
        teams = admin_session.get(f"{API}/teams/public", timeout=15).json()
        assert len(teams) >= 1
        target = teams[0]
        r = member_session.post(
            f"{API}/profile/join-team",
            params={"team_id": target["team_id"]}, timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        # verify via /auth/me
        me = member_session.get(f"{API}/auth/me", timeout=15).json()
        assert me.get("team_id") == target["team_id"]
        assert me.get("team") == target["name"]

    def test_join_team_invalid(self, member_session):
        r = member_session.post(f"{API}/profile/join-team", params={"team_id": "nope-xyz"}, timeout=15)
        assert r.status_code == 404
