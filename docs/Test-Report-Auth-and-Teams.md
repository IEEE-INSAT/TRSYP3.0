# TRSYP 3.0 — Test Report: Authentication & Team Management

**Project:** TRSYP 3.0 Registration Platform
**Modules under test:** Authentication, Team lifecycle (create / join / update / disband / leave / remove member)
**Environment:** Frontend `http://localhost:3000` · Backend API `http://localhost:3001` · Auth & DB: Supabase (PostgreSQL)
**Feature flag:** `NEXT_PUBLIC_FEATURE_REGISTRATION_API=true` → team actions hit the **live backend** (not the local placeholder).
**Tester:** _____________________  **Date:** _____________________  **Build / commit:** _____________________

---

## 1. Overview

This report documents functional testing of the authentication flow and the full team-management lifecycle. Each test case lists the steps performed, the expected result, the observed result, a Pass/Fail verdict, and a placeholder for a supporting screenshot (UI and/or the corresponding Supabase table row).

**Architecture recap (for context):**
- Users authenticate against **Supabase**; the frontend sends the Supabase access token as a Bearer token.
- The backend verifies the JWT via JWKS, resolves an internal DB user, and (after `/auth/sync-user`) authorizes protected routes.
- Team actions map to `/registration/team*` endpoints and are persisted in the `Team` / `Participant` tables in Supabase.

**Data model touched (verify these tables in Supabase screenshots):**
- `Participant` — `teamId` (membership), `ownedTeam` (leadership), `paid`, `banned`
- `Team` — `id`, `code` (6-char join code), `name`, `size`, `leaderId`, members relation

---

## 2. Test Environment & Preconditions

| Item | Value |
|------|-------|
| Frontend URL | `http://localhost:3000` |
| Backend URL | `http://localhost:3001` |
| Auth provider | Supabase (JWKS-verified JWT) |
| Registration API | Live (`FEATURE_REGISTRATION_API=true`) |
| Test accounts | Leader: __________  Member(s): __________ |
| Precondition | Each tester account has completed **Step 1 (Participant profile)** before team actions — team endpoints reject users with no participant profile. |

---

## 3. Authentication

### TC-AUTH-01 — Sign up / account creation
| | |
|---|---|
| **Steps** | 1. Open the app → registration flow. 2. Create an account with a new email/password via Supabase. |
| **Expected** | Account is created; a new row appears in Supabase **Auth → Users**. Session token is issued. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Supabase → Authentication → Users (new user row)_ |

### TC-AUTH-02 — Sign in
| | |
|---|---|
| **Steps** | 1. Sign in with valid credentials. |
| **Expected** | Session established; user is redirected into the app; auth store holds a valid access token. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _App logged-in state_ |

### TC-AUTH-03 — User sync into local DB
| | |
|---|---|
| **Steps** | 1. After first sign-in, trigger `/auth/sync-user` (via the app flow). |
| **Expected** | A `User` row is created/linked in the DB by `supabaseId`; authenticated routes stop returning the "call /auth/sync-user first" error. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Supabase → Table Editor → `User` row (matching `supabaseId`)_ |

### TC-AUTH-04 — Protected route rejects unauthenticated request
| | |
|---|---|
| **Steps** | 1. Call a protected endpoint (e.g. `GET /registration/team`) with no / invalid token. |
| **Expected** | `401 Unauthorized`. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Network response 401_ |

### TC-AUTH-05 — Sign out
| | |
|---|---|
| **Steps** | 1. Sign out from the app. |
| **Expected** | Session cleared; protected pages redirect to login; token no longer attached. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Logged-out state_ |

---

## 4. Create Team (Leader path)

Endpoint: `POST /registration/team` · UI: Registration → Team step → "Yes, I'm the leader".

### TC-TEAM-01 — Create a team successfully
| | |
|---|---|
| **Steps** | 1. As a user with a completed profile, choose "leader". 2. Enter a team name (2–50 chars). 3. Pick a size (2–6). 4. Submit "Create Team". |
| **Expected** | Team created; the UI shows the Team status panel with the team name, role **Leader**, and a generated **6-character join code**. A new `Team` row is created with the current participant as `leaderId` and first member. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _UI (join code visible) + Supabase `Team` row + `Participant.teamId` set_ |

### TC-TEAM-02 — Validation: team name length
| | |
|---|---|
| **Steps** | Try name < 2 chars and > 50 chars. |
| **Expected** | Blocked with "Team name must be 2–50 characters." (client) / `400` (server). |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Validation message_ |

### TC-TEAM-03 — Validation: team size bounds
| | |
|---|---|
| **Steps** | Attempt size outside 2–6. |
| **Expected** | Blocked with "Team size must be between 2 and 6." / `400`. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Validation message_ |

### TC-TEAM-04 — Cannot create a second team (already in a team)
| | |
|---|---|
| **Steps** | While already leading/belonging to a team, attempt to create another. |
| **Expected** | `409 Conflict` — "You already lead a team." / "You are already a member of a team." |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Error response_ |

---

## 5. Join Team (Member path)

Endpoint: `POST /registration/team/join` · UI: Team step → "No, I'm joining" → enter 6-char code.

### TC-JOIN-01 — Join with a valid code
| | |
|---|---|
| **Steps** | 1. As a second account (profile completed), choose "joining". 2. Enter the leader's 6-char code. 3. Submit. |
| **Expected** | Joined successfully; Team status panel shows role **Member** and the member appears in the members list. `Participant.teamId` set; member count increments. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _UI members list + Supabase `Participant.teamId` + updated member count_ |

### TC-JOIN-02 — Validation: code must be exactly 6 chars
| | |
|---|---|
| **Steps** | Enter a code that isn't 6 characters. |
| **Expected** | Blocked: "The team code is exactly 6 characters." / `400`. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Validation message_ |

### TC-JOIN-03 — Invalid / non-existent code
| | |
|---|---|
| **Steps** | Enter a well-formed but non-existent code. |
| **Expected** | `404` — "No team found with that code." |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Error message_ |

### TC-JOIN-04 — Cannot join when the team is full
| | |
|---|---|
| **Steps** | Fill a team to its `size`, then attempt one more join. |
| **Expected** | `403 Forbidden` — "This team is already full (N/N members)." |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Error message + Supabase member count = size_ |

### TC-JOIN-05 — Cannot join when already in a team
| | |
|---|---|
| **Steps** | While already in a team, try to join another via code. |
| **Expected** | `409 Conflict` — "You are already in a team." |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Error message_ |

---

## 6. Update Team (Leader only)

Endpoint: `PATCH /registration/team`.

### TC-UPD-01 — Update team name
| | |
|---|---|
| **Steps** | As the leader, change the team name to a valid value and save. |
| **Expected** | Name updated in UI and in the Supabase `Team` row. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Supabase `Team.name` before/after_ |

### TC-UPD-02 — Update team size (valid)
| | |
|---|---|
| **Steps** | As the leader, change size to a value ≥ current member count, within 2–6. |
| **Expected** | Size updated; `spotsLeft` recalculated. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Supabase `Team.size` updated_ |

### TC-UPD-03 — Cannot shrink size below current member count
| | |
|---|---|
| **Steps** | With N members, set size < N. |
| **Expected** | `400` — "Cannot reduce team size below current member count (N). Remove members first." |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Error message_ |

### TC-UPD-04 — Non-leader cannot update
| | |
|---|---|
| **Steps** | As a member (not leader), attempt an update. |
| **Expected** | `404` — "You do not lead a team." (update is leader-only) |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Error response_ |

---

## 7. Remove Member (Leader) & Leave Team (Member)

### TC-MEM-01 — Leader removes a member
| | |
|---|---|
| **Steps** | As the leader, click "Remove" next to a member. Endpoint: `DELETE /registration/team/members/:participantId`. |
| **Expected** | Member removed from the list; member count decrements; that participant's `teamId` cleared. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _UI list + Supabase `Participant.teamId` = null_ |

### TC-MEM-02 — Leader cannot remove themselves
| | |
|---|---|
| **Steps** | Attempt to remove the leader via the members endpoint. |
| **Expected** | `409` — leaders cannot kick themselves (use disband instead); no "Remove" button shown for the leader in the UI. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _UI (no remove on leader)_ |

### TC-MEM-03 — Member leaves the team
| | |
|---|---|
| **Steps** | As a member, click "Leave Team". Endpoint: `DELETE /registration/team/leave`. |
| **Expected** | Member exits; UI returns to the leader/member choice; `Participant.teamId` cleared; team member count decrements. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Supabase `Participant.teamId` = null_ |

### TC-MEM-04 — Leader cannot "leave" (must disband)
| | |
|---|---|
| **Steps** | As the leader, attempt to leave (leader UI shows "Disband", not "Leave"). |
| **Expected** | `409` if the leave endpoint is called directly; UI only offers **Disband** for the leader. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Leader UI (Disband button)_ |

---

## 8. Disband Team (Leader only)

Endpoint: `DELETE /registration/team`.

### TC-DIS-01 — Leader disbands the team
| | |
|---|---|
| **Steps** | As the leader, click "Disband Team". |
| **Expected** | Team deleted; **all** members (including the leader) are freed — their `teamId` is cleared and they can create/join another team. UI returns to the leader/member choice. |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Supabase `Team` row deleted + all members' `teamId` = null_ |

### TC-DIS-02 — Non-leader cannot disband
| | |
|---|---|
| **Steps** | As a member, attempt to disband. |
| **Expected** | `404` — "You do not lead a team." (UI shows Leave, not Disband). |
| **Observed** | _____________________ |
| **Verdict** | ☐ Pass ☐ Fail |
| **Screenshot** | _Error / UI_ |

---

## 9. Business-Rule Edge Cases (cross-cutting)

| ID | Rule | Expected | Verdict | Screenshot |
|----|------|----------|---------|------------|
| TC-EDGE-01 | Team action without a participant profile | `404` — "Complete Step 1 of registration first." | ☐ Pass ☐ Fail | ____ |
| TC-EDGE-02 | Banned participant creates/joins a team | `403` — "Banned participants cannot …" | ☐ Pass ☐ Fail | ____ |
| TC-EDGE-03 | Paid (locked) participant changes team | `403` — "Your registration is paid and locked." | ☐ Pass ☐ Fail | ____ |
| TC-EDGE-04 | Join code is case-insensitive | Lowercase code is upper-cased and matches | ☐ Pass ☐ Fail | ____ |
| TC-EDGE-05 | Join code uniqueness | Each team has a unique 6-char code | ☐ Pass ☐ Fail | ____ |

---

## 10. Summary of Results

| Section | Total | Pass | Fail | Blocked |
|---------|:-----:|:----:|:----:|:-------:|
| Authentication | 5 | | | |
| Create Team | 4 | | | |
| Join Team | 5 | | | |
| Update Team | 4 | | | |
| Remove / Leave | 4 | | | |
| Disband | 2 | | | |
| Edge cases | 5 | | | |
| **Total** | **29** | | | |

**Overall assessment:** _____________________________________________

**Defects / notes:** _____________________________________________

**Tester signature:** _______________  **Reviewed by (supervisor):** _______________
