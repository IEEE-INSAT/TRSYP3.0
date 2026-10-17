# Ethical Decision Test

A standalone page for TRSYP 3.0's Ethical Decision Test. Participants open the
link (no login), see one scenario at a time and vote **Allow** or **Override**.
The moderators move everyone from scenario to scenario on `/control`. Votes are
never sent or saved.

- `/` - the participant page
- `/control` - the moderators' remote (needs the moderator key)
- Scenarios: `lib/scenarios.ts`

There is no database. The current step is one value in a Vercel **Global
Config** store (formerly Edge Config). Changes reach every phone within about
10 seconds. Vercel's CDN keeps the state for 2 seconds, so the store is read
about once every 2 seconds however many phones are open - well inside the free
plan (100,000 reads and 100 writes; a session uses about 15 writes).

## Run locally

```bash
npm install
cp .env.example .env.local   # set MODERATOR_KEY; leave the rest empty
npm run dev
```

Without a Global Config store the state is kept in the dev server's memory,
which is fine for trying it out.

## Deploy on Vercel

1. **Import the project**: New Project -> this repository -> set
   **Root Directory** to `ethics-test`.
2. **Create the store**: Storage -> Create -> Global Config, and connect it to
   this project. Vercel adds the `GLOBAL_CONFIG` variable for you.
3. **Add the environment variables** (Settings -> Environment Variables):
   - `MODERATOR_KEY` - a long random value; share it with the moderators only
   - `GLOBAL_CONFIG_ID` - the store's id (starts with `ecfg_`), shown on the store's page
   - `VERCEL_API_TOKEN` - an access token from Account Settings -> Tokens,
     scoped to the account or team that owns the store
   - `VERCEL_TEAM_ID` - only if the store belongs to a team
4. **Redeploy** so the variables are picked up.

## Running a session

1. Moderators open `/control` and unlock it with the key.
2. **Start: show scenario 1** - every phone shows it.
3. Participants vote, then see "Watch the screen for the results".
4. **Close voting** while you show the results.
5. **Next: scenario N**, and after the last one **Finish the test**.

"Jump here" moves to any scenario; **Reset to "waiting to start"** starts over.
