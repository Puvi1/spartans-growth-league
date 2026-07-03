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
