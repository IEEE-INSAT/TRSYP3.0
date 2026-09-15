-- ============================================================================
-- Add late members to an existing CHALLENGE team (post-close adjustment).
--
-- IMPORTANT: public.users is NOT provisioned by hand. The trigger
-- public.handle_new_user() (see supabase_triggers.sql) inserts the
-- public.users row when a row lands in auth.users. users."supabaseId" is
-- UNIQUE/NOT NULL and must be a real auth.users id, otherwise the person can
-- never sign in. So: create the AUTH user first, then run STEP 2.
--
-- STEP 1 - preferred: Supabase Dashboard > Authentication > Users > Add user
--   * Auto Confirm User = ON  (otherwise users.active stays false)
--   * User Metadata:  { "name": "<first name>", "lastName": "<last name>" }
--   The trigger fills public.users automatically. Then skip to STEP 2.
--
-- STEP 1-BIS - pure SQL alternative if you cannot use the dashboard.
-- STEP 2      - participants + team_memberships rows.
-- ============================================================================


-- ============================================================================
-- STEP 1-BIS (optional): create the auth users in SQL
-- Edit the VALUES list. The trigger creates public.users for each row.
--
-- USE THE DASHBOARD IF YOU CAN. Hand-writing auth.users depends on the GoTrue
-- schema version and has several known failure modes:
--   * pgcrypto must be enabled, or extensions.crypt()/gen_salt() do not exist.
--   * some GoTrue versions leave confirmation_token / recovery_token /
--     email_change nullable with no default; a NULL there makes sign-in fail
--     with "converting NULL to string is unsupported". If that happens:
--       update auth.users set confirmation_token = '', recovery_token = '',
--              email_change = '', email_change_token_new = ''
--       where confirmation_token is null;
--   * if the auth.identities insert complains about a missing "id", add
--     gen_random_uuid() as the first column - older versions have no default.
-- Keep the email list in the identities insert in sync with the one above it.
-- ============================================================================
/*
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  lower(t.email),
  extensions.crypt(t.password, extensions.gen_salt('bf')),
  now(),                                                   -- confirmed -> users.active = true
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', t.first_name, 'lastName', t.last_name),
  now(), now()
from (values
  --  email,                     temp password,   first name,  last name
  ('member1@example.com',      'ChangeMe!2026', 'Amine',     'Ben Salah'),
  ('member2@example.com',      'ChangeMe!2026', 'Sarra',     'Trabelsi')
) as t(email, password, first_name, last_name)
where not exists (select 1 from auth.users u where lower(u.email) = lower(t.email));

-- Email/password login also needs an identity row.
insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id,
       u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
from auth.users u
where lower(u.email) in ('member1@example.com', 'member2@example.com')
  and not exists (
    select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
  );

-- Tell each new member to use "Forgot password" so they set their own.
*/


-- ============================================================================
-- STEP 2: participant profile + challenge team membership
-- Edit ONLY the VALUES list below, then run the whole block.
-- ============================================================================
do $$
declare
  r                record;
  v_user_id        text;
  v_participant_id text;
  v_team_id        text;
  v_team_size      int;
  v_member_count   int;
  v_existing_team_id text;
  v_existing_code    text;
begin
  for r in
    select * from (values
      -- email                | phone (E.164) | gender  | ieee_id (null if not IEEE) | is_ras | sb (null if none) | participant_type            | team code
      ('ademkhalil815@gmail.com',    '+21624176703', 'male',   102359995::int, true, 'FST'::text, 'Student'::text, 'KVEGX6'),
      ('Mariemmayoufi812@gmail.com', '+21694237367', 'female', 102353840::int, true, 'FST'::text, 'Student'::text, 'KVEGX6'),
      -- no IEEE ID on file: confirm this member is really an IEEE Student member.
      -- If not, switch to 'NonIEEE' and is_ras false (the script forces is_ras
      -- false for NonIEEE anyway, but participant_type would still be wrong).
      ('rayenkh2004kh@gmail.com',    '+21624342710', 'male',   null::int,      true, 'FST'::text, 'Student'::text, 'KVEGX6'),
      ('hammasaida371@gmail.com',    '+21652806551', 'female', 99753176::int,  true, 'FST'::text, 'Student'::text, 'KVEGX6')
    ) as t(email, phone, gender, ieee_id, is_ras, sb, participant_type, team_code)
  loop
    ------------------------------------------------------------------
    -- 1. the user must already exist (created via STEP 1 / 1-BIS)
    ------------------------------------------------------------------
    select id into v_user_id
    from public.users
    where lower(email) = lower(r.email);

    if v_user_id is null then
      raise exception 'No public.users row for % - create the auth user first (STEP 1).', r.email;
    end if;

    ------------------------------------------------------------------
    -- 2. the target challenge team
    ------------------------------------------------------------------
    select id, size into v_team_id, v_team_size
    from public.teams
    where code = r.team_code and activity = 'CHALLENGE';

    if v_team_id is null then
      raise exception 'No CHALLENGE team with code %', r.team_code;
    end if;

    ------------------------------------------------------------------
    -- 3. participant row (one per user)
    ------------------------------------------------------------------
    select id into v_participant_id
    from public.participants
    where user_id = v_user_id;

    if v_participant_id is null then
      insert into public.participants (
        id, user_id, ieee_id, phone, gender, participant_type,
        sb, country, is_ras, paid, is_international, banned,
        created_at, updated_at
      ) values (
        gen_random_uuid()::text,
        v_user_id,
        r.ieee_id,
        r.phone,
        r.gender,
        r.participant_type::"ParticipantType",
        r.sb::"SB",
        'Tunisia'::"COUNTRY",
        -- RAS is an IEEE society: force false for non-IEEE, mirroring the service
        (r.participant_type <> 'NonIEEE' and r.is_ras),
        false,   -- paid
        false,   -- is_international
        false,   -- banned
        now(), now()
      )
      returning id into v_participant_id;

      raise notice 'created participant % for %', v_participant_id, r.email;
    else
      raise notice 'participant already exists for % (%)', r.email, v_participant_id;
    end if;

    ------------------------------------------------------------------
    -- 4. existing challenge membership?
    --    The unique index is (participant_id, activity), so a participant
    --    already in ANOTHER challenge team cannot simply be inserted here -
    --    that has to be a deliberate move, not a silent no-op.
    ------------------------------------------------------------------
    select tm.team_id into v_existing_team_id
    from public.team_memberships tm
    where tm.participant_id = v_participant_id
      and tm.activity = 'CHALLENGE';

    if v_existing_team_id = v_team_id then
      raise notice 'SKIP: % is already in challenge team %', r.email, r.team_code;
      continue;
    elsif v_existing_team_id is not null then
      select code into v_existing_code from public.teams where id = v_existing_team_id;
      raise exception
        '% is already in challenge team %. To move them, first run: delete from public.team_memberships where participant_id = % and activity = ''CHALLENGE'';',
        r.email, v_existing_code, quote_literal(v_participant_id);
    end if;

    ------------------------------------------------------------------
    -- 5. capacity check - teams.size is the hard cap the API enforces,
    --    and the leader occupies a membership row too.
    ------------------------------------------------------------------
    select count(*) into v_member_count
    from public.team_memberships
    where team_id = v_team_id;

    if v_member_count >= v_team_size then
      raise exception
        'Team % is full (%/%). Raise the cap first: update public.teams set size = size + 1, updated_at = now() where code = %;',
        r.team_code, v_member_count, v_team_size, quote_literal(r.team_code);
    end if;

    ------------------------------------------------------------------
    -- 6. membership
    ------------------------------------------------------------------
    insert into public.team_memberships (id, participant_id, team_id, activity, created_at)
    values (gen_random_uuid()::text, v_participant_id, v_team_id, 'CHALLENGE', now());

    raise notice 'added % to challenge team % (%/%)', r.email, r.team_code, v_member_count + 1, v_team_size;
  end loop;
end $$;


-- ============================================================================
-- VERIFY
-- ============================================================================
select t.code,
       t.name,
       t.size,
       u.name || ' ' || u."lastName" as member,
       u.email,
       p.phone,
       p.ieee_id,
       p.is_ras,
       p.sb,
       (p.id = t.leader_id)          as is_leader
from public.teams t
join public.team_memberships tm on tm.team_id = t.id
join public.participants p      on p.id = tm.participant_id
join public.users u             on u.id = p.user_id
where t.activity = 'CHALLENGE'
  and t.code in ('KVEGX6')
order by is_leader desc, tm.created_at;
