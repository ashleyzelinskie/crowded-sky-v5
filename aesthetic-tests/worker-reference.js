/**
 * Crowded Sky — companion relay Worker (v5 reference)
 *
 * GET  /target  → the card the gallery screen is showing right now
 * POST /target  → gallery screen only; needs header X-Write-Key matching the WRITE_KEY secret
 *
 * Setup (once):
 *   1. KV namespace bound as  CROWDED_SKY  (wrangler.toml below, or Dashboard → Worker → Settings → Bindings)
 *   2. New key:  npx wrangler secret put WRITE_KEY   (paste a long random string;
 *      make one with:  openssl rand -hex 24)
 *   3. On the gallery machine open  autonomous-v5.html#gallery=<that key>  once.
 *
 * Why this is safer than v4:
 *   - the key lives only in Cloudflare and on the gallery machine, never in page source
 *   - POST bodies are checked field by field (known fields, types, length caps), so even
 *     a leaked key can't push arbitrary text or HTML to visitors' phones
 *   - at most one write every 3 seconds
 *
 * If your current Worker stores data somewhere else (the v4 page mentions Supabase),
 * keep that storage and copy just validate() and the key check into it.
 *
 * wrangler.toml:
 *   name = "crowded-sky"
 *   main = "worker.js"
 *   compatibility_date = "2026-11-01"
 *   [[kv_namespaces]]
 *   binding = "CROWDED_SKY"
 *   id = "<your namespace id>"
 */

const ALLOWED_ORIGINS = ['https://art.ashleyzelinskie.com'];
const MIN_WRITE_GAP_MS = 3000;

// field → [type, max length]
const SCHEMA = {
  norad:          ['id', 16],
  name:           ['str', 60],
  type:           ['int', 0],
  alt:            ['num', 0],
  period:         ['numstr', 12],
  inc:            ['numstr', 12],
  ecc:            ['numstr', 12],
  raan:           ['numstr', 12],
  mm:             ['numstr', 16],
  m0:             ['numstr', 16],
  epoch:          ['str', 32],
  country:        ['str', 60],
  launched:       ['str', 32],
  purpose:        ['str', 80],
  classification: ['str', 60],
  constellation:  ['str', 60],
  note:           ['str', 600],
  notice:         ['str', 60],
  warning:        ['str', 80],
  sim_year:       ['int', 0],
  projected:      ['bool', 0],
};

function clean(s, max) {
  // plain text only: strip control characters and anything tag-like, cap length
  return String(s).replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, max);
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const out = {};
  for (const [k, [kind, max]] of Object.entries(SCHEMA)) {
    const v = body[k];
    if (v === undefined || v === null || v === '') { out[k] = null; continue; }
    if (kind === 'str') out[k] = clean(v, max);
    else if (kind === 'int') { const n = Number(v); if (!Number.isInteger(n) || Math.abs(n) > 1e6) return null; out[k] = n; }
    else if (kind === 'num') { const n = Number(v); if (!Number.isFinite(n) || Math.abs(n) > 1e7) return null; out[k] = n; }
    else if (kind === 'numstr') { if (!/^-?\d{1,9}(\.\d{1,10})?$/.test(String(v))) return null; out[k] = String(v); }
    else if (kind === 'id') { const s = String(v); if (!/^(\d{1,7}|PROJ-\d{5})$/.test(s)) return null; out[k] = /^\d+$/.test(s) ? Number(s) : s; }
    else if (kind === 'bool') out[k] = v === true;
  }
  if (!out.name) return null;
  return out;
}

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Write-Key',
    'Vary': 'Origin',
  };
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const h = cors(req.headers.get('Origin') || '');
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (url.pathname !== '/target') return new Response('Not found', { status: 404, headers: h });

    if (req.method === 'GET') {
      const data = await env.CROWDED_SKY.get('target');
      return new Response(data || 'null', {
        headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    if (req.method === 'POST') {
      if (!env.WRITE_KEY || !safeEqual(req.headers.get('X-Write-Key') || '', env.WRITE_KEY)) {
        return new Response('Forbidden', { status: 403, headers: h });
      }
      const last = Number(await env.CROWDED_SKY.get('last_write') || 0);
      if (Date.now() - last < MIN_WRITE_GAP_MS) return new Response('Too many writes', { status: 429, headers: h });

      const text = await req.text();
      if (text.length > 8000) return new Response('Too large', { status: 413, headers: h });
      let body; try { body = JSON.parse(text); } catch { return new Response('Bad JSON', { status: 400, headers: h }); }
      const card = validate(body);
      if (!card) return new Response('Rejected', { status: 422, headers: h });

      card.updated_at = new Date().toISOString();
      await env.CROWDED_SKY.put('target', JSON.stringify(card));
      await env.CROWDED_SKY.put('last_write', String(Date.now()));
      return new Response('ok', { headers: h });
    }
    return new Response('Method not allowed', { status: 405, headers: h });
  },
};
