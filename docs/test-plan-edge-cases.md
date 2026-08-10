# TRSYP 3.0 — Extended Test Plan (Edge Cases & Abnormal Behaviour)

Companion to §4 of the Technical Report. The existing test covered the **happy path
under load** (11 users, 4 teams, everything succeeded). This plan covers the
opposite: what happens when users do the wrong thing, do it twice, do it at the
same time, or do it with a crafted request instead of the UI.

16 scenarios across 6 categories. Each one states what is being probed, how to
run it, and what a **pass** looks like.

---

## 0. Test setup

```bash
# Backend under test
export API=https://<render-backend>.onrender.com

# A participant's Supabase access token.
# Easiest source: sign in on the site, open DevTools > Application > Local Storage,
# copy access_token out of the sb-<project-ref>-auth-token entry.
export TOKEN="eyJ..."          # participant A
export TOKEN_B="eyJ..."        # participant B
export ADMIN_TOKEN="eyJ..."    # an account present in the `admins` table

auth() { echo "Authorization: Bearer $1"; }
```

Every scenario below assumes a **staging database**, not production. Several of
them create garbage rows or delete accounts on purpose.

> Environment note: `COMPETITION_REGISTRATION_PHASE` and
> `CHALLENGE_REGISTRATION_PHASE` (`soon` | `open` | `closed`) drive several of
> these tests. Defaults are `open` and `soon` respectively.

---

## A. Authentication & session

### A1 — Requests with a missing, malformed, or expired token

**Probes:** that every protected route actually refuses unauthenticated callers,
and that a tampered token cannot be replayed.

```bash
# no token
curl -i $API/registration/profile
# garbage token
curl -i $API/registration/profile -H "$(auth notatoken)"
# valid token with one character of the signature flipped
curl -i $API/registration/profile -H "$(auth ${TOKEN}X)"
# expired token: leave a session idle >1h, disable auto-refresh, reuse the token
```

**Pass:** `401 Unauthorized` on all four. No stack trace, no DB detail in the body.
`ignoreExpiration: false` in `supabase-jwt.strategy.ts` is what makes the expired
case work — this test is what proves it stayed that way.

---

### A2 — Deleted account replays its still-valid token

**Probes:** whether deleting an account actually ends that user's access.

```bash
# 1. Participant A signs in and copies their token (TOKEN).
# 2. An admin deletes the account:
curl -i -X POST $API/admin/delete-account \
  -H "$(auth $ADMIN_TOKEN)" -H 'Content-Type: application/json' \
  -d '{"supabaseId":"<A_supabase_uuid>"}'
# 3. Immediately reuse A's old token:
curl -i $API/auth/me -H "$(auth $TOKEN)"
```

**Expected pass:** `401`.
**What the code currently does:** `SupabaseJwtStrategy.validate()` finds no DB
user and **lazily re-creates one** (`prisma.user.upsert`, `active: true`) — the
comment calls it a self-healing safety net. So the deleted user is likely to get
`200` and a resurrected `users` row until the token expires (up to 1 hour).
Their participant/team rows stay deleted, so the account comes back half-empty.

Record the actual status code. If it is 200, the fix is to check
Supabase for the user before provisioning, rather than trusting the token alone.

---

### A3 — Open-redirect attempt through the OAuth `next` parameter

**Probes:** `sanitizeNext()` in `lib/auth/post-auth.ts`, which exists specifically
to stop a crafted post-login redirect from sending users off-site.

Open each of these in a browser while signed out, complete Google sign-in:

```
https://rtc.ieee.tn/auth/callback/?next=//evil.example.com
https://rtc.ieee.tn/auth/callback/?next=/\evil.example.com
https://rtc.ieee.tn/auth/callback/?next=https://evil.example.com
https://rtc.ieee.tn/auth/callback/?next=/auth/callback/
```

**Pass:** all four land on `/register` (or `/dashboard` if already registered).
The browser must never navigate to an external host, and the last one must not
loop.

Also test the **cross-device** case: request the email verification link on a
laptop, open it on a phone. `localStorage` is empty there, so the `?next=` param
is the only carrier — the user should still land somewhere sensible, not a blank page.

---

## B. Input validation & data integrity

### B1 — Team name that is technically 2+ characters but effectively empty

**Probes:** validation ordering in `CreateTeamSchema`
(`.min(2).max(50).trim()` — the length checks run **before** the trim).

```bash
curl -i -X POST $API/registration/team \
  -H "$(auth $TOKEN)" -H 'Content-Type: application/json' \
  -d '{"name":"      ","size":3}'          # 6 spaces

curl -i -X POST $API/registration/team \
  -H "$(auth $TOKEN)" -H 'Content-Type: application/json' \
  -d '{"name":"  a  ","size":3}'           # passes min(2), trims to 1 char
```

**Expected pass:** `400`, both.
**Likely actual:** `201` with `name: ""` and `name: "a"` — a team with a blank
name in the admin dashboard. Fix is to trim first: `z.string().trim().min(2).max(50)`.

Also check the honest boundaries: 1 char → 400, exactly 2 → 201, exactly 50 → 201,
51 → 400.

---

### B2 — Numeric and enum abuse on the registration form

**Probes:** the gap between what Zod accepts and what PostgreSQL can store.

```bash
# ieeeId beyond 32-bit int range (Prisma `Int` = PG integer, max 2147483647)
curl -i -X POST $API/registration -H "$(auth $TOKEN)" -H 'Content-Type: application/json' \
  -d '{"phone":"+21611111111","gender":"male","participantType":"Student","country":"Tunisia","ieeeId":9999999999}'

# capitalised gender — Zod enum is strictly lowercase
... -d '{"phone":"+21611111112","gender":"Male",...}'

# size as a string, and as a decimal
curl -i -X POST $API/registration/team -H "$(auth $TOKEN)" -H 'Content-Type: application/json' \
  -d '{"name":"Test","size":"3"}'
... -d '{"name":"Test","size":2.5}'

# invalid enums
... -d '{"country":"Atlantis",...}'   ... -d '{"sb":"HOGWARTS",...}'
```

**Pass:** `400 Validation failed` with a field-keyed `errors` object on every one.
Watch the oversized `ieeeId` specifically — Zod has no upper bound on it, so it
reaches PostgreSQL and raises a numeric-overflow error that `handlePrismaError()`
does not map (it only handles P2002/P2025). Expect a **500** there; a user typo of
one extra digit should not produce a server error. Fix: `.max(2147483647)` on the
schema.

---

### B3 — Mass assignment: privileged fields injected into the request body

**Probes:** whether a participant can promote themselves by adding fields the UI
never sends.

```bash
curl -i -X POST $API/registration \
  -H "$(auth $TOKEN)" -H 'Content-Type: application/json' \
  -d '{"phone":"+21622222222","gender":"male","participantType":"Student",
       "country":"Tunisia","paid":true,"banned":false,"userId":"<someone-elses-uuid>"}'
```

Then read it back as an admin and confirm `paid: false`.

**Pass:** `201`, and the stored row has `paid: false`. Zod strips unknown keys and
the service only reads named fields, so this should hold — the test exists to
guarantee it stays true as DTOs change. Repeat on `PATCH /registration/profile`
with `{"paid":true}` and on `POST /registration/team` with `{"leaderId":"..."}`.

---

## C. Team lifecycle — abnormal paths

### C1 — The wrong person performs each team action

**Probes:** leader-only vs member-only route separation in `registration/service`.

| # | Action | Endpoint | Expected |
|---|--------|----------|----------|
| a | Leader tries to *leave* their own team | `DELETE /registration/team/leave` | `409` "leaders cannot leave" |
| b | Member tries to *disband* the team | `DELETE /registration/team` | `404` "you do not lead a team" |
| c | Member tries to kick another member | `DELETE /registration/team/members/<id>` | `404` |
| d | Leader kicks themselves | `DELETE /registration/team/members/<own-id>` | `409` |
| e | Leader kicks someone from a *different* team | same, with a foreign participant id | `404` |
| f | Kick with a non-UUID | `.../members/abc` | `400` (ParseUUIDPipe) |

```bash
curl -i -X DELETE "$API/registration/team/leave" -H "$(auth $TOKEN)"
curl -i -X DELETE "$API/registration/team" -H "$(auth $TOKEN_B)"
curl -i -X DELETE "$API/registration/team/members/abc" -H "$(auth $TOKEN)"
```

**Pass:** every row matches. Case (e) is the important one — it confirms a leader
cannot reach into another team's roster.

---

### C2 — Join-code abuse

**Probes:** `joinTeam()` code handling and the size cap.

```bash
J() { curl -i -X POST $API/registration/team/join -H "$(auth $TOKEN_B)" \
      -H 'Content-Type: application/json' -d "{\"code\":\"$1\"}"; }

J "abcdef"      # lowercase form of a real code  -> should JOIN (uppercased server-side)
J "ABCDEF "     # trailing space -> 7 chars      -> 400
J "ZZZZZZ"      # well-formed, nonexistent       -> 404
J "ABC"         # too short                      -> 400
J "<own team's code>"   # already a member       -> 409 "already a member of this team"
J "<full team's code>"  # team at capacity       -> 403 "already full"
```

Also try codes containing `0`, `O`, `1`, `I`, `L` — the generator deliberately
excludes those (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), so a user who reads `0` for
`O` off a screenshot must get a clean `404`, not a crash.

**Pass:** as annotated above.

---

### C3 — Deleting a profile while leading a team

**Probes:** the guard in `deleteParticipant()` that stops a cascade from silently
deleting a whole team.

```bash
# Case 1 — leader with teammates
curl -i -X DELETE $API/registration/profile -H "$(auth $LEADER_TOKEN)"
# Case 2 — leader who is the only member
curl -i -X DELETE $API/registration/profile -H "$(auth $SOLO_LEADER_TOKEN)"
# Case 3 — a participant who has been marked paid
curl -i -X DELETE $API/registration/profile -H "$(auth $PAID_TOKEN)"
```

**Pass:** Case 1 → `409` with a message naming the number of teammates, and the
team still exists afterwards. Case 2 → `204`, and the team row is gone with no
orphaned `team_memberships`. Case 3 → `403` (refund first).

Verify Case 1 with a follow-up admin `GET /registration/admin/teams` — no team
should have vanished.

---

### C4 — Registration window transitions mid-session

**Probes:** `assertActivityOpen()`, which gates *create* and *join* but
deliberately leaves *manage* open.

1. With `COMPETITION_REGISTRATION_PHASE=open`, load the registration page and
   fill the team form but do not submit.
2. Change the env var to `closed` and redeploy/restart the backend.
3. Submit the form.

```bash
curl -i -X POST $API/registration/team -H "$(auth $TOKEN)" \
  -H 'Content-Type: application/json' -d '{"name":"Late Team","size":3}'
```

**Pass:** `403` "Competition team registration is closed", and the frontend shows
that message rather than a generic failure.

Then confirm the intentional exception — with the window still `closed`, an
existing leader must still be able to:

```bash
curl -i -X PATCH  $API/registration/team -H "$(auth $TOKEN)" -H 'Content-Type: application/json' -d '{"name":"Renamed"}'
curl -i -X DELETE $API/registration/team -H "$(auth $TOKEN)"
```

**Pass:** both succeed. Closing registration must not trap people in teams.

Repeat with `CHALLENGE_REGISTRATION_PHASE=soon`: a *valid* challenge team code
must still be rejected with `403` "has not opened yet" (the phase is checked
after the code is resolved, so this is a distinct path from C2's 404).

---

## D. Concurrency & race conditions

This is the section that extends §4 of the report most directly — the original
test had 11 cooperating users; these have users colliding.

### D1 — Concurrent joins to the last free seat  ⚠️ highest priority

**Probes:** `joinTeam()` reads `target.memberships.length` and compares it to
`target.size` **inside a transaction, but without locking the team row**, and
there is no database constraint on member count. Under PostgreSQL READ COMMITTED,
concurrent transactions can all read the same count and all insert.

Setup: one team with `size: 3` and 2 members (1 free seat), 5 other registered
participants with valid tokens.

```bash
# 5 simultaneous joins of the same code
for T in $T1 $T2 $T3 $T4 $T5; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/registration/team/join \
    -H "Authorization: Bearer $T" -H 'Content-Type: application/json' \
    -d '{"code":"ABCDEF"}' &
done; wait

# then check the real roster size
curl -s $API/registration/admin/teams?search=ABCDEF -H "$(auth $ADMIN_TOKEN)" | jq '.data[0].memberCount'
```

**Pass:** exactly one `200`, four `403`, and `memberCount == 3`.
**Failure mode to watch for:** two or more `200`s and `memberCount > size`, i.e. a
4-person team in a 3-person competition. Fix is a `SELECT … FOR UPDATE` on the
team row (`$queryRaw`) at the top of the transaction, or a counter column with a
check constraint.

---

### D2 — Double-submit of the same action

**Probes:** idempotency when the UI's `submitting` flag is bypassed (double-click
on a slow connection, or a retried request).

```bash
# same user, two simultaneous team creations
for i in 1 2; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/registration/team \
    -H "$(auth $TOKEN)" -H 'Content-Type: application/json' \
    -d '{"name":"Dup","size":3}' &
done; wait

# same user, two simultaneous registrations
for i in 1 2; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/registration \
    -H "$(auth $TOKEN_B)" -H 'Content-Type: application/json' \
    -d '{"phone":"+21633333333","gender":"male","participantType":"Student","country":"Tunisia"}' &
done; wait
```

**Pass:** one `201` and one `409` in each pair; exactly one row in the DB.
The unique indexes (`@@unique([leaderId, activity])`, `Participant.userId`) are
what make this safe — this test proves the constraint, not the application check,
is doing the work.

Note the message quality on the losing request: the P2002 path maps `user_id` to
a generic *"A record with this data already exists (user_id)"*. Worth adding to
`fieldMessages` so a double-click shows something human.

---

### D3 — Disband racing a join / kick racing a leave

**Probes:** referential behaviour when two people mutate the same team at once.

```bash
# leader disbands while a member joins with the code
( curl -s -o /dev/null -w "disband:%{http_code}\n" -X DELETE $API/registration/team -H "$(auth $LEADER)" ) &
( curl -s -o /dev/null -w "join:%{http_code}\n" -X POST $API/registration/team/join \
    -H "$(auth $TOKEN_B)" -H 'Content-Type: application/json' -d '{"code":"ABCDEF"}' ) &
wait

# leader kicks a member at the same moment that member leaves
( curl -s -o /dev/null -w "kick:%{http_code}\n" -X DELETE $API/registration/team/members/$MEMBER_ID -H "$(auth $LEADER)" ) &
( curl -s -o /dev/null -w "leave:%{http_code}\n" -X DELETE $API/registration/team/leave -H "$(auth $MEMBER)" ) &
wait
```

**Pass:** no `500`. Acceptable outcomes are `204`+`404`, or `204`+`200`. Then
verify no orphaned `team_memberships` rows point at a deleted team:

```sql
SELECT COUNT(*) FROM team_memberships m
  LEFT JOIN teams t ON t.id = m.team_id WHERE t.id IS NULL;  -- must be 0
```

---

## E. Authorization & privilege

### E1 — Participant reaching admin endpoints  ⚠️ high priority

**Probes:** `RolesGuard`, which authorises on `payload.role` taken straight from
the JWT — while `AdminService.createAdmin()` grants admin via
`app_metadata.role`. Those are **two different claims**.

```bash
# A) a plain participant hitting every admin route
for p in "registration/admin/participants" "registration/admin/teams"; do
  curl -s -o /dev/null -w "$p -> %{http_code}\n" $API/$p -H "$(auth $TOKEN)"
done
curl -i -X POST $API/registration/admin/participants/$PID/ban \
  -H "$(auth $TOKEN)" -H 'Content-Type: application/json' -d '{"reason":"test"}'
curl -i -X POST $API/admin/create-admin -H "$(auth $TOKEN)" \
  -H 'Content-Type: application/json' -d '{"email":"x@y.com","password":"x","name":"a","lastName":"b","position":"CHAIR"}'

# B) the same routes with a REAL admin token
for p in "registration/admin/participants" "registration/admin/teams"; do
  curl -s -o /dev/null -w "$p -> %{http_code}\n" $API/$p -H "$(auth $ADMIN_TOKEN)"
done
```

**Pass:** (A) `403` on all — no participant may list other participants or ban
anyone. (B) `200` on all.

**Expect (B) to fail with 403.** Supabase puts the Postgres role
(`"authenticated"`) in the top-level `role` claim; `app_metadata.role = "admin"`
does not change it. If (B) returns 403, real admins cannot use these endpoints at
all, and `RolesGuard` should be switched to the `admins`-table lookup that
`AdminGuard` already does correctly. Either way, record both results — this single
test settles which of the two admin mechanisms is live.

---

### E2 — Banned and paid participants still acting

**Probes:** the consistency of the two "locked" states. `createTeam`, `joinTeam`,
`markAsPaid`, and `requestVisaLetter` check `banned`; `updateProfile` checks
`paid` but **not** `banned`; `leaveTeam`, `disbandTeam`, and `kickMember` check
**neither**.

```bash
# ban a participant who is currently leading a team
curl -X POST $API/registration/admin/participants/$PID/ban -H "$(auth $ADMIN_TOKEN)" \
  -H 'Content-Type: application/json' -d '{"reason":"test"}'

# now, as that banned participant:
curl -i -X POST   $API/registration/team      -H "$(auth $BANNED)" -d '{"name":"X","size":2}' -H 'Content-Type: application/json'
curl -i -X POST   $API/registration/team/join -H "$(auth $BANNED)" -d '{"code":"ABCDEF"}'     -H 'Content-Type: application/json'
curl -i -X PATCH  $API/registration/profile   -H "$(auth $BANNED)" -d '{"phone":"+21699999999"}' -H 'Content-Type: application/json'
curl -i -X DELETE $API/registration/team      -H "$(auth $BANNED)"
```

**Expected:** first two `403`. Last two are the interesting ones — a banned user
can currently still edit their phone number and **disband a team full of
non-banned members**.

Repeat the same four calls as a **paid** participant. `createTeam`/`joinTeam`
refuse with "your registration is paid and locked", but `disbandTeam` and
`leaveTeam` do not — so the lock the code advertises is not actually enforced on
the exit paths.

**Pass criterion:** decide the intended policy, then make all six paths agree.
Document whichever way you choose.

---

### E3 — Endpoints that are hidden in the UI but live on the API

**Probes:** the report says payment / rooming / visa are "temporarily disabled on
the frontend" — but `RoomingModule` is mounted in `app.module.ts` and the visa
routes live inside the registration controller. Hiding a button does not close a route.

```bash
curl -i -X POST $API/rooming -H "$(auth $TOKEN)" -H 'Content-Type: application/json' -d '{"size":2}'
curl -i $API/rooming/my-room -H "$(auth $TOKEN)"
curl -i -X POST $API/registration/visa -H "$(auth $TOKEN)" -H 'Content-Type: application/json' \
  -d '{"passportNumber":"AB1234567","passportIssuanceCountry":"Algeria","issuingOffice":"Algiers",
       "passportIssuanceDate":"2020-01-15","passportExpiryDate":"2030-01-15",
       "embassyAddress":"18 Avenue de la Republique, Tunis","residenceAddress":"123 Rue Didouche, Algiers"}'
```

**Pass:** either these return `403/404` (properly gated), or the report is amended
to say the modules are hidden in the UI while remaining reachable via the API.
A participant creating rooming rows now means garbage to clean up before the
feature actually launches.

Also test the **visa validation asymmetry** while you are here: `POST` refuses a
passport that has already expired, but `PATCH` uses
`RequestVisaBaseSchema.partial()`, which drops the cross-field refinements —

```bash
curl -i -X PATCH $API/registration/visa -H "$(auth $INTL_TOKEN)" \
  -H 'Content-Type: application/json' -d '{"passportExpiryDate":"2001-01-01"}'
```

**Expected:** `400`. **Likely:** `200`, storing an expired passport.

---

## F. Availability, abuse & monitoring

### F1 — Rate limiting under abusive traffic

**Probes:** `ThrottlerModule` (50 requests / 60 s, global) and `trust proxy: 1`.

```bash
# 60 rapid requests from one IP
for i in $(seq 1 60); do
  curl -s -o /dev/null -w "%{http_code} " $API/health
done; echo

# attempt to bypass the per-IP limit by spoofing the forwarded header
for i in $(seq 1 60); do
  curl -s -o /dev/null -w "%{http_code} " $API/health -H "X-Forwarded-For: 1.2.3.$i"
done; echo
```

**Pass:** the first loop turns to `429` at request 51. The second loop **also**
turns to `429` — `trust proxy: 1` means only Render's own hop is trusted, so a
client-supplied `X-Forwarded-For` must not mint a fresh rate-limit bucket.

Then check the endpoints where throttling matters most:
- `POST /auth/check-email` — returns `409` for a registered address and `200` for
  an unregistered one, which is an **email-enumeration oracle**. 50/min is enough
  to test thousands of addresses per hour. Compare with `POST /auth/reset-password`,
  which correctly returns the same message either way.
- `POST /challenge/submit` — see F2.

---

### F2 — Riddle challenge: unauthenticated brute force and cross-team interference

**Probes:** `ChallengeController` has **no auth guard** and `submit()` has **no
attempt cap** — a code alone identifies a team, and anyone holding it can act on
that team's behalf.

```bash
# 1. brute-force the answer to one riddle
for w in lighthouse beacon tower signal compass anchor harbour; do
  curl -s -X POST $API/challenge/submit -H 'Content-Type: application/json' \
    -d "{\"code\":\"$RIDDLE_CODE\",\"answer\":\"$w\"}"; echo
done

# 2. someone else's code, submitted by a stranger — inflates THEIR attempt count
curl -s -X POST $API/challenge/submit -H 'Content-Type: application/json' \
  -d "{\"code\":\"$OTHER_TEAM_CODE\",\"answer\":\"wrong\"}"

# 3. garbage and probe codes
curl -i -X POST $API/challenge/access -H 'Content-Type: application/json' -d '{"code":"!!!!!!!"}'   # -> 400
curl -i -X POST $API/challenge/access -H 'Content-Type: application/json' -d '{"code":"AAAAAAA"}'   # -> 400 or 404
```

**Pass criteria to agree on before the event:**
- Attempts increment correctly and stop incrementing once solved (that part is
  already implemented — verify it).
- Brute force is bounded by *something* — currently only the global 50/min/IP
  limit, which allows ~3000 guesses/hour from one machine, or unlimited from a
  handful of IPs. If attempts affect ranking, add a per-team cap.
- Case (2) is the one to decide on: today a rival can drive another team's attempt
  counter up. Acceptable only if attempts do not affect scoring.
- Note that a *well-formed but unknown* code returns `404 "Team not found"` while
  a malformed one returns `400`. That difference lets an attacker distinguish real
  team codes from fake ones. Returning `400` for both closes it.

---

### F3 — Health check does not reflect real health

**Probes:** report §2.4 states health checks are exposed "via `@nestjs/terminus`".
`app.controller.ts` is a plain handler returning a static `{ status: 'ok' }`, and
`@nestjs/terminus` is not a dependency of the backend.

```bash
curl -s $API/health          # -> {"status":"ok"}
```

Now point `DATABASE_URL` at an unreachable host (or pause the Supabase project)
and call it again.

**Expected:** a degraded/`503` response.
**Actual:** still `{"status":"ok"}` — UptimeRobot will report the service as UP
while every user-facing request fails, which is the exact failure it is there to
catch.

**Fix:** add `@nestjs/terminus` with a `PrismaHealthIndicator` running
`SELECT 1`, and point UptimeRobot at that route.

Also verify frontend monitoring: the site is a static export served over FTP, so
UptimeRobot pinging `https://rtc.ieee.tn/` proves only that the web server is
alive — it says nothing about whether the API the page depends on is reachable.
Consider a second monitor on the backend health route (which is likely already
what keeps the Render instance warm).

---

## Summary table

| # | Scenario | Category | Priority |
|---|----------|----------|----------|
| A1 | Missing / malformed / expired token | Auth | High |
| A2 | Deleted account replays valid token | Auth | High |
| A3 | Open redirect via `?next=` | Auth | Medium |
| B1 | Whitespace-only team name | Validation | Medium |
| B2 | Numeric overflow & enum abuse | Validation | Medium |
| B3 | Mass assignment of `paid` / `banned` | Validation | High |
| C1 | Wrong actor per team action | Team lifecycle | High |
| C2 | Join-code abuse | Team lifecycle | Medium |
| C3 | Delete profile while leading a team | Team lifecycle | High |
| C4 | Registration window closes mid-flow | Team lifecycle | Medium |
| D1 | Concurrent joins to last seat | Concurrency | **Critical** |
| D2 | Double-submit create / register | Concurrency | High |
| D3 | Disband vs join, kick vs leave | Concurrency | Medium |
| E1 | Participant reaching admin routes | Authorization | **Critical** |
| E2 | Banned / paid users still acting | Authorization | High |
| E3 | UI-hidden but live endpoints | Authorization | Medium |
| F1 | Rate limiting & header spoofing | Availability | High |
| F2 | Riddle brute force & interference | Availability | Medium |
| F3 | Health check does not check health | Monitoring | High |

*(19 scenarios across the 6 categories — comfortably past the 10 requested.)*

---

## Suggested result-recording format for the report

| ID | Scenario | Expected | Actual | Status | Notes |
|----|----------|----------|--------|--------|-------|
| D1 | 5 concurrent joins, 1 seat | 1×200, 4×403, memberCount=3 | | ☐ Pass ☐ Fail | |
| E1 | Participant → `/registration/admin/participants` | 403 | | ☐ Pass ☐ Fail | |
| … | | | | | |

Findings that fail become a short "Known issues & remediation" subsection —
which reads considerably better to a supervisor than a test report where
everything passed.
