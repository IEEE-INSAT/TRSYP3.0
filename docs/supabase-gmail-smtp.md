# Sending auth emails without DNS changes

The browser sends account-confirmation and password-reset requests directly to
Supabase Auth. Render does not connect to SMTP, so this works on Render's free
plan.

## One-time Supabase setup

1. Open **Supabase Dashboard → Authentication → Email** and enable
   **Custom SMTP**.
2. Enter the existing Google Workspace mailbox settings:

   | Field | Value |
   | --- | --- |
   | Host | `smtp.gmail.com` |
   | Port | `587` |
   | Username | `trsyp@ieee.tn` |
   | Password | a Google app password for that mailbox |
   | Sender email | `trsyp@ieee.tn` |
   | Sender name | `TRSYP 3.0` |

   This sends as the mailbox that already exists; it does not require a DNS
   record or a new email provider domain.
3. Keep **Confirm email** enabled.
4. In **Authentication → URL Configuration**, set the Site URL to the public
   frontend URL and allow these redirect URLs:

   ```text
   https://rtc.ieee.tn/verify-email/
   https://rtc.ieee.tn/reset-password/
   ```

5. Use the default **Confirm signup** and **Reset password** templates, or make
   sure custom templates include `{{ .ConfirmationURL }}`.

Existing unconfirmed accounts can use the **Resend verification email** button
in the sign-up confirmation dialog after this deployment.

## Why this works

The frontend calls Supabase's `auth.signUp` and `auth.resetPasswordForEmail`
APIs. Supabase hands messages to Gmail SMTP, so Render's free-plan SMTP-port
restriction is no longer in the delivery path.
