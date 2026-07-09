// Local rate-limit test — run the backend with `npm run start:dev`, then:
//   k6 run backend/test/load/rate-limit.local.js
//
// It fakes distinct clients via X-Forwarded-For. Because main.ts sets
// `trust proxy: 3`, req.ip resolves to the LEFT-MOST XFF entry, so each VU
// (unique left-most IP) is treated as a separate client with its own bucket.
//
// Expected with a 20-req / 60s limit:
//   - each simulated IP gets ~20 * 200 responses, then 429s
//   - a shared bucket would instead give each VU only a handful of 200s
import http from 'k6/http';
import { Counter } from 'k6/metrics';

const ok = new Counter('status_200');
const limited = new Counter('status_429');

export const options = {
  scenarios: {
    // 5 distinct simulated clients, each firing well over its 20/min budget.
    clients: { executor: 'per-vu-iterations', vus: 5, iterations: 40, maxDuration: '70s' },
  },
  thresholds: {
    // Every distinct IP must get its full budget → isolation holds.
    status_200: ['count>=70'],   // 5 clients * ~15 min successes
    // Over-budget traffic must be limited → the guard is actually running.
    status_429: ['count>=1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Left-most = the simulated client; the two trailing hops mimic Cloudflare +
  // Render so the offset matches `trust proxy: 3`.
  const xff = `203.0.113.${__VU}, 162.158.0.1, 10.0.0.1`;
  const res = http.get(`${BASE_URL}/health`, { headers: { 'X-Forwarded-For': xff } });
  if (res.status === 200) ok.add(1);
  else if (res.status === 429) limited.add(1);
}
