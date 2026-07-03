# SPARTANS GROWTH LEAGUE — PRD

## Problem Statement
Gamified performance tracking & accountability platform for a Crypto Network Marketing team. Feels like Duolingo + Habitica + modern CRM. Premium Black + Gold + Blue aesthetic, mobile-first, dark theme, glass UI, confetti on achievements, smooth animations.

## Stack
- **Backend**: FastAPI + MongoDB (motor)
- **Frontend**: React 19 + Tailwind + Framer Motion + Shadcn UI + Phosphor icons + canvas-confetti
- **Auth**: JWT (email/password, bcrypt) + Emergent Google OAuth

## User Personas
- **Super Admin** — Manages all users + teams + all reports + leaderboards
- **Team Leader** — Views only their team + member performance + team reports
- **Member** — Submits missions (check-in, prospects, follow-ups, attendance) + own dashboard + own reports + own leaderboard

## Core Requirements (Static)
- Scale to thousands of members
- Mobile-first responsive
- No placeholder pages
- Reusable components
- Modern professional animations
- Dark theme

## What's Been Implemented (Feb 2026)

### Auth
- JWT email/password with bcrypt hashing, cookies (httpOnly, samesite=none) + Bearer fallback
- Emergent Google OAuth session exchange
- Brute-force lockout (5 fail → 15 min, using X-Forwarded-For)
- Roles: super_admin, team_leader, member

### Gamification
- Daily check-ins with streaks (current + longest)
- XP system (10/check-in, 5/prospect, 50/won, 8/followup done, 15/attendance)
- Level formula: `floor(sqrt(xp/100)) + 1`
- 10-badge catalog with auto-unlock on milestones (streak, prospects, wins, level, etc.)
- Confetti on check-in, wins, achievements
- Individual + team leaderboards (weekly, monthly, all-time) with podium

### CRM / Missions
- Prospects CRUD with pipeline stages (new/contacted/qualified/won/lost)
- Follow-ups with urgency indicators (overdue/today/soon/upcoming)
- Attendance tracker (meeting/training/webinar/call)

### Challenges
- Weekly + monthly challenges with auto-progress tracking
- Team leaders + super admins can create challenges
- XP rewards on completion

### Role Management System (Complete)
- **Teams** collection (super_admin CRUD): create, rename, assign leader, add/remove members, delete
- **/my-team** (team_leader only): full team overview + squad breakdown
- **/reports** (adaptive): Personal (all), Team (leader+admin), Global (admin only)
- Reports include 14-day XP timeline, per-user stats, conversion rates, team standings
- Role-aware sidebar navigation (BASE_NAV + LEADER/ADMIN extras)
- Route guards via ProtectedRoute (roles=[...])
- Team-scoped /admin/users and /admin/analytics for team_leader
- Leaderboard `?team_id=` filter for team-scoped rankings

### Test Coverage
- Backend: 29/29 role mgmt + 24/25 core = 53/54 pass (98%)
- Frontend: 21/21 role mgmt + 15/15 core = 36/36 (100%)

## Backlog / Next Actions
- **P1**: Team invitation links / bulk import
- **P1**: Password reset UI (backend endpoint exists)
- **P2**: Push notifications for pending follow-ups
- **P2**: CSV export of team reports
- **P2**: Aggregate DB queries for reports (currently N+1)
- **P2**: Team leader ability to create challenges scoped to their team only
- **P3**: Direct messages / team chat
- **P3**: Custom badge creation UI for super admin

## Daily Mission System (Feb 2026)

### Implemented
- **New collection**: `missions` (mission_id UUID unique, user_id, prospect_name, mobile_number, notes, status, lat, lng, google_maps_url, accuracy, photo_data base64, created_at, updated_at)
- **Indexes**: `mission_id` unique + `(user_id, created_at desc)` compound
- **XP Rules**: `mission_logged: +10`, `mission_converted: +40` (PATCH new→converted adds +30 delta)
- **Endpoints**:
  - `GET /api/missions` — user's mission list (owner-scoped)
  - `POST /api/missions` — create, auto-generate google_maps_url from lat/lng, awards XP, auto-progress prospect challenges
  - `PATCH /api/missions/{id}` — status/notes update; XP delta on conversion
  - `DELETE /api/missions/{id}` — owner-only, 404 for others (data isolation verified)
- **Photo storage**: base64 data URL inline in MongoDB, 1.5MB limit (returns 413 if exceeded), client-side JPEG compression to ≤1200px @ 0.72 quality
- **Frontend**:
  - `/missions` page with 4-way filter chips (All/New/Follow-up/Converted)
  - **Live GPS capture** via navigator.geolocation with accuracy display + refresh button + Google Maps preview link
  - **Camera capture** via `<input type=file accept="image/*" capture="environment">` for direct mobile camera
  - Card grid history (3 col desktop / 2 tablet / 1 mobile) with photo thumbnail, status chip, GPS badge, phone tap-to-call, map link, inline status edit, delete
  - Detail modal on card click showing full photo + all fields
  - Added to sidebar nav (Crosshair icon) + mobile bottom nav (2nd slot)

### Test Results
- Backend: 13/13 mission tests passing (after index fix)
- Frontend: verified via screenshot (missions page + modal render correctly, GPS permission flow works)

## Weekly + Season Attendance + Believer + Tasks (Feb 2026)

### Collections
- `weekly_events` — event_id UUID unique, name, weekday (0-6), is_believer bool, active
- `event_attendance` — compound unique (user_id, event_id, event_date). Fields: status (present|absent|na), season_id (nullable), locked (computed)
- `seasons` — season_id, name, start_date, end_date, is_believer, created_by
- `tasks` — task_id unique, assigned_to+due_date compound, title, description, xp_reward, status (pending|completed), completed_at

### Auto-Lock (Critical)
- Timezone: **IST (Asia/Kolkata)**, cutoff **8:00 AM** on event day
- `_is_locked(event_date)` returns True once `now_ist >= combine(event_date, 08:00, IST)`
- Backend rejects `POST /event-attendance/mark` with 403 when locked

### Seeded Defaults (on startup if empty)
- Tuesday — Believer Season Meeting (is_believer=true)
- Thursday — MCM (Meta Champion Meet)
- Saturday — Spartans Team Meeting

### Endpoints
- `GET /api/weekly-events` (auth)
- `POST/PATCH/DELETE /api/weekly-events[/<id>]` (super_admin)
- `GET /api/event-attendance/week?week_of=YYYY-MM-DD`
- `POST /api/event-attendance/mark` — upsert on (user, event, date), auto-season assignment
- `GET/POST/DELETE /api/seasons[/<id>]` (create/delete super_admin only)
- `GET /api/seasons/{id}/my-report` — personal attendance stats + per-event breakdown + attendance_pct
- `GET /api/seasons/{id}/team-report` — team_leader (own team) or super_admin (all users; believer season scopes to is_believer=true users)
- `PATCH /api/admin/users/{uid}/believer` (super_admin)
- `GET /api/tasks` (own) or `?all_users=true` (super_admin)
- `POST /api/tasks` (super_admin)
- `PATCH /api/tasks/{id}/complete` (assignee or super_admin) — awards XP
- `DELETE /api/tasks/{id}` (super_admin)

### Believer Module
- `user.is_believer` boolean flag (super_admin toggle)
- Believer seasons filter events to weekday=1 (Tuesday) only in `_compute_report`
- Team-report for believer season only counts `is_believer=true` users

### Frontend Pages
- `/weekly-attendance` — week nav, 3 event cards, colored borders on marked status, LOCKED/OPEN chips, 8 AM IST notice
- `/seasons` — All/Regular/Believer filter, card grid, admin create modal (name/dates/believer toggle), tap-to-open report modal with % + progress bar + per-event breakdown
- `/tasks` — Mine/All toggle (admin), Assign Task modal (admin), pending list with Complete button (assignee), Recently Crushed archive

### Attendance Percentage Formula
`attendance_pct = present / (present + absent) * 100` — NA and unmarked excluded from denominator

### Test Coverage
- Backend: **30/30** (100%) — /app/backend/tests/test_weekly_attendance.py
- Frontend: **30/30** (100%) across all 3 roles + mobile responsive at 375x812
