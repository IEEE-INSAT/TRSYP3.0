// Verifies `app.set('trust proxy', N)` is correct — i.e. the server resolves
// req.ip to the REAL client, not to a Cloudflare/Render proxy address.
//
// NOTE: needs a temporary debug endpoint that echoes the resolved IP. It was
// removed after the setup was confirmed — re-add it to app.controller.ts to
// reuse this check:
//   @Get('debug/ip')
//   getDebugIp(@Req() req: Request) {
//     return { ip: req.ip, xff: req.headers['x-forwarded-for'] ?? null };
//   }
//
//   k6 run -e BASE_URL="https://YOUR-CLOUDFLARE-DOMAIN" backend/test/load/trust-proxy.check.js
//
// PASS  → server's req.ip == your real public IP           → trust proxy is right
// FAIL  → server saw 162.158.x (Cloudflare) / 10.x (Render) → hop count is off
import http from 'k6/http';
import { check } from 'k6';

export const options = { vus: 1, iterations: 1 };

export default function () {
  // 1. Discover this machine's real public IP (same IP k6's requests exit from).
  const myIp = http.get('https://api.ipify.org').body.toString().trim();

  // 2. Ask the backend what IP it resolved us to. Go through the SAME hostname
  //    real users hit (Cloudflare-fronted), so the hop count matches production.
  const res = http.get(`${__ENV.BASE_URL}/debug/ip`);

  let resolved;
  let xff;
  try {
    const parsed = res.json();
    resolved = parsed.ip;
    xff = parsed.xff;
  } catch {
    console.error(`could not parse /debug/ip response (status ${res.status}): ${res.body}`);
  }

  console.log(`your real public IP     = ${myIp}`);
  console.log(`server resolved req.ip  = ${resolved}`);
  console.log(`raw x-forwarded-for     = ${xff}`);

  check(null, {
    'got a resolved ip from /debug/ip': () => !!resolved,
    'req.ip == real client IP (trust proxy correct)': () => resolved === myIp,
  });
}
