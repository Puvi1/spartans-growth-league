"""Backend tests for Spartans League v2 batch:
- Goals CRUD
- Position Badges (catalog + admin update)
- Team Leader add-member
- Spartans League (active-season / individual / team)
- Admin dashboard widgets
- Unified Exports (CSV + PDF)
- PROFILE_FIELDS count = 15 (no 'position')
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://growth-gamified-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = ("admin@spartans.com", "Spartan123!")
LEADER = ("leader@spartans.com", "Leader123!")
MEMBER = ("member@spartans.com", "Member123!")


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    tok = r.json().get("access_token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def admin_token():
    return _login(*ADMIN)


@pytest.fixture(scope="module")
def leader_token():
    return _login(*LEADER)


@pytest.fixture(scope="module")
def member_token():
    return _login(*MEMBER)


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ---------- Profile completion field count ----------
class TestProfileFields:
    def test_profile_completion_15_fields(self, admin_token):
        r = requests.get(f"{API}/profile/completion", headers=H(admin_token), timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 15, f"Expected 15 profile fields, got {data['total']}"


# ---------- Position Badges ----------
class TestPositionBadges:
    def test_catalog_returns_5_badges(self, admin_token):
        r = requests.get(f"{API}/position-badges/catalog", headers=H(admin_token), timeout=10)
        assert r.status_code == 200
        badges = r.json()["badges"]
        assert isinstance(badges, list) and len(badges) == 5
        expected = {"team_leader", "star_performer", "rising_star", "consistent_achiever", "top_recruiter"}
        assert set(badges) == expected

    def test_member_cannot_update_badges(self, member_token, admin_token):
        # need a target user; use member itself
        me = requests.get(f"{API}/auth/me", headers=H(member_token), timeout=10).json()
        uid = me["user_id"]
        r = requests.patch(f"{API}/admin/users/{uid}/position-badges",
                           headers=H(member_token), json={"badges": ["star_performer"]}, timeout=10)
        assert r.status_code in (401, 403), f"expected 401/403 got {r.status_code}"

    def test_admin_can_update_badges(self, admin_token, member_token):
        me = requests.get(f"{API}/auth/me", headers=H(member_token), timeout=10).json()
        uid = me["user_id"]
        r = requests.patch(f"{API}/admin/users/{uid}/position-badges",
                           headers=H(admin_token), json={"badges": ["star_performer", "rising_star"]}, timeout=10)
        assert r.status_code == 200, r.text
        # verify
        me2 = requests.get(f"{API}/auth/me", headers=H(member_token), timeout=10).json()
        assert "star_performer" in me2.get("position_badges", [])
        # cleanup
        requests.patch(f"{API}/admin/users/{uid}/position-badges",
                       headers=H(admin_token), json={"badges": []}, timeout=10)

    def test_invalid_badge_rejected(self, admin_token, member_token):
        me = requests.get(f"{API}/auth/me", headers=H(member_token), timeout=10).json()
        r = requests.patch(f"{API}/admin/users/{me['user_id']}/position-badges",
                           headers=H(admin_token), json={"badges": ["nonexistent_badge"]}, timeout=10)
        assert r.status_code in (400, 422)


# ---------- Goals ----------
class TestGoals:
    def test_goals_crud_flow(self, member_token):
        # list
        r = requests.get(f"{API}/goals", headers=H(member_token), timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

        # create
        payload = {"title": "TEST_goal_batch", "target": 3, "period": "weekly", "xp_reward": 30}
        r = requests.post(f"{API}/goals", headers=H(member_token), json=payload, timeout=10)
        assert r.status_code == 200, r.text
        goal = r.json()
        gid = goal["goal_id"]
        assert goal["title"] == "TEST_goal_batch"
        assert goal["target"] == 3
        assert goal["progress"] == 0
        assert goal["status"] == "active"

        # bump progress
        r = requests.patch(f"{API}/goals/{gid}/progress", headers=H(member_token),
                           json={"progress": 1}, timeout=10)
        assert r.status_code == 200
        assert r.json()["goal"]["progress"] == 1

        # complete
        r = requests.patch(f"{API}/goals/{gid}/progress", headers=H(member_token),
                           json={"progress": 3}, timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body["goal"]["status"] == "completed"
        assert body["goal"]["completed_at"] is not None

        # cannot re-complete
        r = requests.patch(f"{API}/goals/{gid}/progress", headers=H(member_token),
                           json={"progress": 3}, timeout=10)
        assert r.status_code == 400

        # delete
        r = requests.delete(f"{API}/goals/{gid}", headers=H(member_token), timeout=10)
        assert r.status_code == 200
        # verify gone
        r = requests.delete(f"{API}/goals/{gid}", headers=H(member_token), timeout=10)
        assert r.status_code == 404


# ---------- Team Leader add-member ----------
class TestTeamLeaderAddMember:
    def test_member_forbidden(self, member_token):
        r = requests.post(f"{API}/team-leader/add-member", headers=H(member_token),
                          json={"email": f"nope_{int(time.time())}@x.com", "name": "N",
                                "password": "Passw0rd!"}, timeout=10)
        assert r.status_code == 403

    def test_leader_can_add_member(self, leader_token):
        email = f"test_recruit_{int(time.time())}@spartans.com"
        r = requests.post(f"{API}/team-leader/add-member", headers=H(leader_token),
                          json={"email": email, "name": "TEST Recruit", "password": "Passw0rd!"}, timeout=15)
        assert r.status_code == 200, r.text
        u = r.json()["user"]
        assert u["email"] == email
        assert u["role"] == "member"
        assert u["team_id"] is not None

        # duplicate should fail
        r2 = requests.post(f"{API}/team-leader/add-member", headers=H(leader_token),
                           json={"email": email, "name": "dup", "password": "Passw0rd!"}, timeout=10)
        assert r2.status_code == 400


# ---------- Spartans League ----------
class TestSpartansLeague:
    def test_active_season(self, admin_token):
        r = requests.get(f"{API}/spartans-league/active-season", headers=H(admin_token), timeout=10)
        assert r.status_code == 200
        assert "season" in r.json()

    def test_individual_league(self, admin_token):
        r = requests.get(f"{API}/spartans-league/individual", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "season" in d and "rows" in d
        rows = d["rows"]
        if len(rows) >= 2:
            # rank ordering by score desc
            scores = [r_.get("score", 0) for r_ in rows]
            assert scores == sorted(scores, reverse=True), f"rows not sorted by score desc: {scores}"
            assert rows[0].get("rank") == 1

    def test_team_league_weights_and_breakdown(self, admin_token):
        r = requests.get(f"{API}/spartans-league/team", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "weights" in d
        w = d["weights"]
        assert w == {"xp": 40, "attendance": 25, "missions": 15, "tasks": 10, "goals": 10}, w
        for row in d.get("rows", []):
            for k in ("xp_pts", "attendance_pts", "missions_pts", "tasks_pts", "goals_pts", "score"):
                assert k in row, f"missing {k} in team row {row}"


# ---------- Admin dashboard widgets ----------
class TestDashboardWidgets:
    def test_widgets_shape(self, admin_token):
        r = requests.get(f"{API}/admin/dashboard-widgets", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("missions_today", "missions_converted_today", "pending_tasks", "overdue_tasks",
                  "top_individual", "top_team", "season_champion",
                  "upcoming_birthdays", "upcoming_anniversaries"):
            assert k in d, f"missing key {k}"


# ---------- Unified Exports ----------
class TestExports:
    @pytest.mark.parametrize("endpoint,params", [
        ("/exports/missions", {"format": "csv"}),
        ("/exports/tasks", {"format": "csv"}),
        ("/exports/goals", {"format": "csv"}),
        ("/exports/followups", {"format": "csv"}),
        ("/exports/spartans-league", {"format": "csv", "scope": "individual"}),
        ("/exports/spartans-league", {"format": "csv", "scope": "team"}),
    ])
    def test_csv_export(self, admin_token, endpoint, params):
        r = requests.get(f"{API}{endpoint}", headers=H(admin_token), params=params, timeout=20)
        assert r.status_code == 200, f"{endpoint} {params} -> {r.status_code} {r.text[:200]}"
        ct = r.headers.get("content-type", "")
        assert "csv" in ct.lower() or "text/plain" in ct.lower(), f"{endpoint} content-type: {ct}"

    @pytest.mark.parametrize("endpoint,params", [
        ("/exports/missions", {"format": "pdf"}),
        ("/exports/tasks", {"format": "pdf"}),
        ("/exports/goals", {"format": "pdf"}),
        ("/exports/followups", {"format": "pdf"}),
        ("/exports/spartans-league", {"format": "pdf", "scope": "individual"}),
        ("/exports/spartans-league", {"format": "pdf", "scope": "team"}),
    ])
    def test_pdf_export(self, admin_token, endpoint, params):
        r = requests.get(f"{API}{endpoint}", headers=H(admin_token), params=params, timeout=25)
        assert r.status_code == 200, f"{endpoint} {params} -> {r.status_code} {r.text[:200]}"
        ct = r.headers.get("content-type", "")
        assert "pdf" in ct.lower(), f"{endpoint} content-type: {ct}"
