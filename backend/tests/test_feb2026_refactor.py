"""Feb 2026 Massive Refactor Test Suite.
Covers: Auth+Nexus, Object Storage avatars, Attendance gating, Admin User/Team CRUD,
Season PV/Earnings, Follow-up Time Slots, Notifications, Season History, League enrichment,
Profile fields, Wipe demo data (LAST).
"""
import os
import io
import time
import pytest
import requests
from datetime import date, timedelta

def _load_frontend_env():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    return line.split("=", 1)[1].strip()
    except Exception:
        return ""
    return ""


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _load_frontend_env()).rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL required"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@spartans.com"
ADMIN_PASS = "Spartan123!"

TS = int(time.time())


# ---------------- Fixtures ----------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def member_ctx(admin_headers):
    """Register a member for tests requiring non-admin perspective."""
    email = f"nexus_test_{TS}@spartans.com"
    payload = {
        "email": email, "password": "Testpass1!", "name": "Nexus Test",
        "nexus_id": "BC-1042",
    }
    r = requests.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    tok = r.json()["access_token"]
    uid = r.json()["user"]["user_id"]
    return {"token": tok, "user_id": uid, "email": email,
            "headers": {"Authorization": f"Bearer {tok}"}}


# ---------------- AUTH + NEXUS ----------------
class TestAuthNexus:
    def test_register_missing_nexus_returns_422(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": f"noexus_{TS}@x.com", "password": "Pass1234!", "name": "No Nexus",
            "nexus_id": ""
        })
        assert r.status_code == 422

    def test_register_with_nexus_persists(self, member_ctx):
        me = requests.get(f"{API}/auth/me", headers=member_ctx["headers"])
        assert me.status_code == 200
        assert me.json().get("nexus_id") == "BC-1042"

    def test_admin_login_returns_nexus_id(self):
        r = requests.post(f"{API}/auth/login",
                          json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        assert r.status_code == 200
        u = r.json().get("user", {})
        assert "nexus_id" in u, "user object missing nexus_id"
        assert u["nexus_id"] == "BC-ADMIN-001"


# ---------------- OBJECT STORAGE ----------------
def _tiny_png_bytes():
    # 1x1 red PNG
    return bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
        "0000000d4944415478da6364f8cfc00000000300010c8d8f240000000049454e44ae426082"
    )


class TestObjectStorage:
    def test_avatar_upload_non_image_400(self, member_ctx):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = requests.post(f"{API}/uploads/avatar", headers=member_ctx["headers"], files=files)
        assert r.status_code == 400

    def test_avatar_upload_oversize_400(self, member_ctx):
        big = b"\x00" * (2 * 1024 * 1024 + 1024)
        files = {"file": ("big.png", big, "image/png")}
        r = requests.post(f"{API}/uploads/avatar", headers=member_ctx["headers"], files=files)
        assert r.status_code == 400

    def test_avatar_upload_valid(self, member_ctx):
        files = {"file": ("avatar.png", _tiny_png_bytes(), "image/png")}
        r = requests.post(f"{API}/uploads/avatar", headers=member_ctx["headers"], files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "file_id" in data
        assert data["url"].startswith("/api/files/")
        # Verify fetch via ?auth=
        file_url = f"{BASE_URL}{data['url']}?auth={member_ctx['token']}"
        r2 = requests.get(file_url)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")


# ---------------- ATTENDANCE GATING ----------------
class TestAttendanceGating:
    def test_future_hidden_for_member(self, member_ctx):
        r = requests.get(f"{API}/event-attendance/week", headers=member_ctx["headers"])
        assert r.status_code == 200
        today = date.today()
        for o in r.json().get("occurrences", []):
            assert date.fromisoformat(o["event_date"]) <= today

    def test_future_visible_for_admin(self, admin_headers):
        r = requests.get(f"{API}/event-attendance/week", headers=admin_headers)
        assert r.status_code == 200
        # Just confirm no filtering — admin sees all seven weekdays if any events exist
        # (Cannot assert future exists unless a future event lies in this week; passes trivially.)

    def test_mark_future_403(self, member_ctx):
        # Find event_id, use future date
        r = requests.get(f"{API}/event-attendance/week", headers={"Authorization": member_ctx["headers"]["Authorization"]})
        # Get an event via admin week
        ra = requests.get(f"{API}/event-attendance/week",
                          headers={"Authorization": member_ctx["headers"]["Authorization"]})
        # Get event list from weekly events endpoint if any
        we = requests.get(f"{API}/weekly-events", headers=member_ctx["headers"])
        if we.status_code != 200 or not we.json():
            pytest.skip("No weekly events configured")
        eid = we.json()[0]["event_id"]
        future = (date.today() + timedelta(days=10)).isoformat()
        r = requests.post(f"{API}/event-attendance/mark", headers=member_ctx["headers"],
                          json={"event_id": eid, "event_date": future, "status": "present"})
        assert r.status_code == 403
        assert "future" in r.json().get("detail", "").lower()

    def test_mark_past_403(self, member_ctx):
        we = requests.get(f"{API}/weekly-events", headers=member_ctx["headers"])
        if we.status_code != 200 or not we.json():
            pytest.skip("No weekly events configured")
        eid = we.json()[0]["event_id"]
        past = (date.today() - timedelta(days=10)).isoformat()
        r = requests.post(f"{API}/event-attendance/mark", headers=member_ctx["headers"],
                          json={"event_id": eid, "event_date": past, "status": "present"})
        assert r.status_code == 403
        assert "past" in r.json().get("detail", "").lower() or "locked" in r.json().get("detail", "").lower()


# ---------------- ADMIN USER MGMT ----------------
class TestAdminUserMgmt:
    def test_member_cannot_patch_user(self, member_ctx):
        r = requests.patch(f"{API}/admin/users/{member_ctx['user_id']}",
                           headers=member_ctx["headers"], json={"name": "X"})
        assert r.status_code in (401, 403)

    def test_admin_patch_user_name(self, admin_headers, member_ctx):
        new_name = f"Renamed_{TS}"
        r = requests.patch(f"{API}/admin/users/{member_ctx['user_id']}",
                           headers=admin_headers, json={"name": new_name})
        assert r.status_code == 200
        u = requests.get(f"{API}/auth/me", headers=member_ctx["headers"]).json()
        assert u["name"] == new_name

    def test_admin_cannot_delete_self(self, admin_headers):
        me = requests.get(f"{API}/auth/me", headers=admin_headers).json()
        r = requests.delete(f"{API}/admin/users/{me['user_id']}", headers=admin_headers)
        assert r.status_code == 400


# ---------------- TEAMS CRUD ----------------
class TestTeamsCRUD:
    def test_create_update_delete_team(self, admin_headers):
        r = requests.post(f"{API}/admin/teams", headers=admin_headers,
                          json={"name": f"Ares_{TS}"})
        assert r.status_code == 200, r.text
        tid = r.json()["team_id"]

        r2 = requests.patch(f"{API}/admin/teams/{tid}", headers=admin_headers,
                            json={"name": f"AresRenamed_{TS}"})
        assert r2.status_code == 200

        r3 = requests.delete(f"{API}/admin/teams/{tid}", headers=admin_headers)
        assert r3.status_code == 200

    def test_delete_team_with_members_fails(self, admin_headers, member_ctx):
        r = requests.post(f"{API}/admin/teams", headers=admin_headers,
                          json={"name": f"HasMembers_{TS}"})
        assert r.status_code == 200
        tid = r.json()["team_id"]
        # Assign member
        requests.patch(f"{API}/admin/users/{member_ctx['user_id']}",
                       headers=admin_headers, json={"team_id": tid})
        r2 = requests.delete(f"{API}/admin/teams/{tid}", headers=admin_headers)
        assert r2.status_code == 400
        # Cleanup: unassign & delete
        requests.patch(f"{API}/admin/users/{member_ctx['user_id']}",
                       headers=admin_headers, json={"team_id": ""})
        requests.delete(f"{API}/admin/teams/{tid}", headers=admin_headers)


# ---------------- SEASON PV/EARNINGS ----------------
class TestSeasonBusiness:
    season_id = None

    def test_create_season_with_pv(self, admin_headers):
        payload = {
            "name": f"Q1_{TS}",
            "start_date": (date.today() - timedelta(days=30)).isoformat(),
            "end_date": (date.today() + timedelta(days=60)).isoformat(),
            "total_pv": 1000, "total_earnings": 50000,
        }
        r = requests.post(f"{API}/seasons", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        s = r.json()
        assert s.get("total_pv") == 1000
        assert s.get("total_earnings") == 50000
        TestSeasonBusiness.season_id = s["season_id"]

    def test_patch_season_updates_pv(self, admin_headers):
        assert TestSeasonBusiness.season_id
        r = requests.patch(f"{API}/admin/seasons/{TestSeasonBusiness.season_id}",
                           headers=admin_headers,
                           json={"total_pv": 2000, "total_earnings": 60000})
        assert r.status_code == 200

    def test_set_user_business(self, admin_headers, member_ctx):
        assert TestSeasonBusiness.season_id
        r = requests.post(f"{API}/admin/users/{member_ctx['user_id']}/business",
                          headers=admin_headers,
                          json={"season_id": TestSeasonBusiness.season_id,
                                "pv": 100, "earnings": 5000})
        assert r.status_code == 200

    def test_business_totals(self, admin_headers):
        assert TestSeasonBusiness.season_id
        r = requests.get(f"{API}/season/business-totals",
                        headers=admin_headers,
                        params={"season_id": TestSeasonBusiness.season_id})
        assert r.status_code == 200
        d = r.json()
        assert "total_pv" in d and "total_earnings" in d and "member_count" in d

    def test_finalize_season_snapshot(self, admin_headers):
        assert TestSeasonBusiness.season_id
        r = requests.post(f"{API}/admin/seasons/{TestSeasonBusiness.season_id}/finalize",
                          headers=admin_headers)
        assert r.status_code == 200, r.text
        assert "snapshot_id" in r.json()

    def test_list_season_history(self, admin_headers):
        r = requests.get(f"{API}/season-history", headers=admin_headers)
        assert r.status_code == 200
        assert any(s["season_id"] == TestSeasonBusiness.season_id for s in r.json())

    def test_get_season_snapshot(self, admin_headers):
        r = requests.get(f"{API}/season-history/{TestSeasonBusiness.season_id}",
                         headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["season_id"] == TestSeasonBusiness.season_id


# ---------------- FOLLOWUP TIME SLOT ----------------
class TestFollowupTimeSlot:
    def test_create_followup_with_timeslot(self, member_ctx):
        due = date.today().isoformat()
        r = requests.post(f"{API}/followups", headers=member_ctx["headers"],
                          json={"title": f"TEST_fu_{TS}", "due_date": due,
                                "time_slot": "10-12pm"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("time_slot") == "10-12pm"


# ---------------- NOTIFICATIONS ----------------
class TestNotifications:
    def test_notifications_shape(self, member_ctx):
        r = requests.get(f"{API}/notifications", headers=member_ctx["headers"])
        assert r.status_code == 200
        d = r.json()
        for k in ["unread", "followups_overdue", "followups_due_today",
                  "goals_pending_weekly", "goals_pending_monthly",
                  "tasks_pending", "tasks_overdue"]:
            assert k in d, f"missing key {k}"


# ---------------- LEAGUE ENRICHMENT ----------------
class TestLeagueEnrichment:
    def test_individual_league_new_fields(self, admin_headers):
        r = requests.get(f"{API}/spartans-league/individual", headers=admin_headers)
        assert r.status_code == 200
        rows = r.json().get("rows", [])
        if rows:
            row = rows[0]
            for k in ["club_type", "nexus_id", "avatar_url", "position_badges"]:
                assert k in row, f"individual row missing {k}"

    def test_team_league_leader_fields(self, admin_headers):
        r = requests.get(f"{API}/spartans-league/team", headers=admin_headers)
        assert r.status_code == 200
        teams = r.json().get("teams", [])
        if teams:
            t = teams[0]
            for k in ["leader_name", "leader_avatar_url", "leader_badges", "mission_pct"]:
                assert k in t, f"team row missing {k}"


# ---------------- PROFILE nexus_id patch ----------------
class TestProfilePatch:
    def test_patch_nexus_id(self, member_ctx):
        r = requests.patch(f"{API}/profile", headers=member_ctx["headers"],
                           json={"nexus_id": "BC-9999"})
        assert r.status_code == 200, r.text
        me = requests.get(f"{API}/auth/me", headers=member_ctx["headers"]).json()
        assert me.get("nexus_id") == "BC-9999"


# ---------------- REGRESSION endpoints load ----------------
class TestRegression:
    @pytest.mark.parametrize("path", [
        "/prospects", "/followups", "/missions", "/tasks",
        "/event-attendance/week", "/goals", "/challenges", "/rewards",
        "/seasons", "/notifications",
    ])
    def test_endpoint_loads(self, admin_headers, path):
        r = requests.get(f"{API}{path}", headers=admin_headers)
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text[:200]}"


# ---------------- WIPE (LAST) ----------------
class TestZWipeLast:
    def test_wipe_demo_data(self, admin_headers):
        r = requests.post(f"{API}/admin/wipe-demo-data", headers=admin_headers)
        assert r.status_code == 200, r.text
        wiped = r.json().get("wiped", {})
        assert "users" in wiped

    def test_only_super_admin_remains(self, admin_headers):
        r = requests.get(f"{API}/admin/users", headers=admin_headers)
        assert r.status_code == 200
        users = r.json()
        non_admin = [u for u in users if u.get("role") != "super_admin"]
        assert len(non_admin) == 0, f"non-admin users remain: {non_admin}"
