-- ============================================================================
-- Supabase auth.users -> public.users synchronization
--
-- These triggers are the SINGLE source of user provisioning. When Supabase
-- inserts a row into auth.users (sign up / OAuth), the row in public.users is
-- created inside the SAME transaction, so it is guaranteed to exist before the
-- client ever receives an access token. No app-level /auth/sync-user endpoint
-- and no race window.
--
-- Design rules:
--   * The insert is wrapped in an exception block so a profile-sync failure can
--     NEVER roll back (and therefore break) the auth signup itself.
--   * ON CONFLICT makes re-fires idempotent.
--   * security definer + a pinned search_path is required to write across schemas
--     safely (prevents search_path hijacking).
-- ============================================================================

-- Function to handle inserts into auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta       jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  provider   text  := coalesce(new.raw_app_meta_data->>'provider', 'email');
  full_name  text;
  first_name text;
  last_name  text;
begin
  -- Name extraction differs by provider:
  --   * email signup  -> our frontend sends explicit `name` + `lastName`.
  --   * OAuth (Google) -> the `name` claim is the FULL display name, so we must
  --     use the OIDC `given_name` / `family_name` claims (or split `full_name`)
  --     instead — otherwise the first name ends up holding the whole name.
  if provider = 'email' then
    first_name := coalesce(nullif(meta->>'name', ''), 'Participant');
    last_name  := coalesce(meta->>'lastName', '');
  else
    full_name  := coalesce(nullif(meta->>'full_name', ''), nullif(meta->>'name', ''), '');
    first_name := coalesce(
      nullif(meta->>'given_name', ''),
      nullif(split_part(full_name, ' ', 1), ''),
      'Participant'
    );
    last_name := coalesce(
      nullif(meta->>'family_name', ''),
      case when position(' ' in full_name) > 0
           then substring(full_name from position(' ' in full_name) + 1)
           else '' end,
      ''
    );
  end if;

  begin
    insert into public.users (
      "id",
      "email",
      "name",
      "lastName",
      "supabaseId",
      "provider",
      "active",
      "updatedAt"
    )
    values (
      gen_random_uuid()::text,                                    -- internal id (Prisma-style)
      new.email,
      first_name,
      last_name,
      new.id::text,                                               -- supabaseId
      coalesce(new.raw_app_meta_data->>'provider', 'email'),
      (new.email_confirmed_at is not null or provider <> 'email'), -- email accounts activate after verification
      now()                                                       -- @updatedAt has no DB default
      -- "createdAt" omitted on purpose: it has a DB default (now())
    )
    on conflict ("supabaseId") do nothing;                        -- idempotent on re-fire
  exception
    when others then
      -- Never let profile-sync failure block auth signup. The backend
      -- SupabaseJwtStrategy has a lazy-upsert fallback that will reconcile
      -- this user on their first authenticated request.
      raise warning 'handle_new_user failed for auth user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- Trigger to fire on insert into auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Activate email accounts when Supabase records a successful verification.
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.users
    set "active" = true,
        "updatedAt" = now()
    where "supabaseId" = new.id::text;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email_confirmed_at on auth.users
  for each row execute procedure public.handle_user_update();
