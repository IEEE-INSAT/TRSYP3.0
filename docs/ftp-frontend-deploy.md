# Deploying the static frontend over FTP

The frontend is a static Next.js export. Build it from `frontend` and upload
the **contents** of `frontend/out` to the website document root (not the `out`
folder itself):

```bash
npm ci
npm run build
```

Use the production values while building:

```text
NEXT_PUBLIC_API_URL=https://trsyp3-0.onrender.com
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

Upload the same current export to `rtc.ieee.tn`. The export also includes
`.htaccess`; make sure the FTP client uploads hidden files. Its Apache rule
redirects `trsyp.ieee.tn` to `https://rtc.ieee.tn`, preserving paths and query
strings. Test the redirect while it is `302`; after it is confirmed, change it
to `301` if you want browsers and search engines to cache it permanently.

If Apache does not honor `.htaccess`, the hosting administrator must enable
`mod_rewrite` and `AllowOverride FileInfo` (or place the same rule in the
virtual-host configuration).
