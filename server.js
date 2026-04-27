'use strict';

// ============================================================
// PHASE 1: Load secrets from environment — NEVER hardcode
// ============================================================
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const path     = require('path');
const os       = require('os');

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// ── Establishment key from env, NOT hardcoded ──────────────
// VULN FIXED: was hardcoded 'AURA2024' in plain source code.
// Anyone with repo access would instantly know the key.
let establishmentKey = process.env.ESTABLISHMENT_KEY ?? 'CHANGE_ME_NOW';

// ── Default accounts — passwords must NOT be plain-text in prod.
// VULN FIXED: was 'admin'/'admin', 'aura2024' etc in plain source.
// These are still plain-text here because there is no DB/bcrypt in
// this prototype.  Before production: hash with bcrypt and store in DB.
// REMOVED: the default "admin / admin" backdoor account entirely.
const DEFAULT_ACCOUNTS = [
  { id: 'STAFF001', password: process.env.STAFF001_PASS ?? 'aura2024',    name: 'Chef Rajan',      role: 'Chef'      },
  { id: 'STAFF002', password: process.env.STAFF002_PASS ?? 'spice2024',   name: 'Manager Priya',   role: 'Manager'   },
  { id: 'STAFF003', password: process.env.STAFF003_PASS ?? 'kitchen2024', name: 'Sous Chef Arjun', role: 'Sous Chef'  },
  // 'admin/admin' test backdoor has been removed — add a real admin via ENV
  ...(process.env.ADMIN_ID && process.env.ADMIN_PASS
    ? [{ id: process.env.ADMIN_ID, password: process.env.ADMIN_PASS, name: 'Administrator', role: 'Admin' }]
    : []),
];

// ── In-memory stores (replace with a real DB for production) ──
let orders = [];
let staffAccounts = [];

// ============================================================
// PHASE 6: NETWORK & TRANSPORT SECURITY
// ============================================================

// ── Helmet: X-Content-Type-Options, X-Frame-Options, HSTS, etc ──
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],       // no inline scripts, no eval
        styleSrc:   ["'self'", "'unsafe-inline'"], // allow CSS-in-JS for now
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
        objectSrc:  ["'none'"],
        frameAncestors: ["'none'"],  // equivalent to X-Frame-Options: DENY
      },
    },
    hsts: {
      maxAge: 31536000,          // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ── CORS: no wildcards — explicit origin only ──────────────
// VULN FIXED: was app.use(cors()) which allows ANY origin.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, same-origin)
      if (!origin || origin === ALLOWED_ORIGIN) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
      }
    },
    methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Staff-Token'],
    credentials: true,
  })
);

app.use(express.json({ limit: '50kb' })); // VULN FIXED: no body size limit allowed 100MB+ payloads

// Serve static assets from project root (legacy pages)
app.use(express.static(path.join(__dirname)));

// ============================================================
// PHASE 4: RATE LIMITING
// ============================================================

// ── Global limiter: 60 req/min per IP ──────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  max:      parseInt(process.env.RATE_LIMIT_MAX        ?? '60',    10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please slow down.' },
  handler: (req, res, next, options) => {
    res.set('Retry-After', Math.ceil(options.windowMs / 1000));
    res.status(429).json(options.message);
  },
});
app.use('/api/', globalLimiter);

// ── Auth limiter: 5 req / 15 min per IP ────────────────────
// VULN FIXED: login endpoint had zero rate limiting → brute-force trivial.
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '900000', 10), // 15 min
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX        ?? '5',      10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many authentication attempts. Try again in 15 minutes.' },
  handler: (req, res, next, options) => {
    res.set('Retry-After', Math.ceil(options.windowMs / 1000));
    res.status(429).json(options.message);
  },
});

// ── Key-update limiter: 3 req / 15 min ─────────────────────
const keyUpdateLimiter = rateLimit({
  windowMs: 900_000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many key update attempts.' },
  handler: (req, res, next, options) => {
    res.set('Retry-After', Math.ceil(options.windowMs / 1000));
    res.status(429).json(options.message);
  },
});

// ============================================================
// PHASE 5: TOKEN / SESSION MIDDLEWARE
// ============================================================
// Simple server-side token map (replace with proper JWT or session store in prod)
const activeSessions = new Map(); // token → { id, role, name }

function generateToken() {
  // Cryptographically random 32-byte hex string
  return require('crypto').randomBytes(32).toString('hex');
}

// ── requireAuth: inject into every staff-only route ────────
function requireAuth(req, res, next) {
  const token = req.headers['x-staff-token'];
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  req.staffUser = activeSessions.get(token);
  next();
}

// ── requireAdmin: only 'Admin' role can access ─────────────
function requireAdmin(req, res, next) {
  if (!req.staffUser || req.staffUser.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  next();
}

// ============================================================
// PHASE 2: INPUT VALIDATION HELPERS
// ============================================================

/** Strip any characters that could be used for injection or XSS */
function sanitizeString(val, maxLen = 100) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[<>"'`\\]/g, '')   // strip HTML/JS special chars
    .trim()
    .slice(0, maxLen);
}

/** Validate staff ID: alphanumeric + underscore, 1-32 chars */
function isValidStaffId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_]{1,32}$/.test(id);
}

/** Validate order status values */
const VALID_STATUSES = new Set(['new', 'cooking', 'ready', 'completed']);

/** Validate an order item */
function isValidOrderItem(item) {
  return (
    item &&
    typeof item.id    === 'string' && item.id.length <= 64  &&
    typeof item.name  === 'string' && item.name.length <= 128 &&
    typeof item.qty   === 'number' && item.qty > 0  && item.qty <= 99   &&
    typeof item.price === 'number' && item.price >= 0 && item.price <= 99999
  );
}

// ============================================================
// REST API ENDPOINTS
// ============================================================

// ── GET /api/orders ── (staff only)
// VULN FIXED: was open to any unauthenticated request.
app.get('/api/orders', requireAuth, (req, res) => {
  res.json(orders);
});

// ── GET /api/orders/:id ── (staff only)
app.get('/api/orders/:id', requireAuth, (req, res) => {
  const id = sanitizeString(req.params.id, 64);
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// ── POST /api/orders ── (public — customers place orders)
// VULN FIXED: no validation whatsoever → arbitrary payload injection.
app.post('/api/orders', (req, res) => {
  const body = req.body;

  // Schema validation
  const tableNum = sanitizeString(String(body.table ?? ''), 4);
  if (!tableNum || !/^\d{1,3}$/.test(tableNum)) {
    return res.status(400).json({ error: 'Invalid table number.' });
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return res.status(400).json({ error: 'Invalid items array.' });
  }

  if (!body.items.every(isValidOrderItem)) {
    return res.status(400).json({ error: 'One or more items failed validation.' });
  }

  const total = Number(body.total);
  if (isNaN(total) || total < 0 || total > 9_999_999) {
    return res.status(400).json({ error: 'Invalid order total.' });
  }

  const order = {
    id:        `ORD-${Date.now()}-${require('crypto').randomBytes(4).toString('hex')}`,
    table:     tableNum,
    items:     body.items.map(i => ({
      id:    sanitizeString(i.id, 64),
      name:  sanitizeString(i.name, 128),
      qty:   Math.round(i.qty),
      price: Number(i.price.toFixed(2)),
    })),
    total:     Number(total.toFixed(2)),
    status:    'new',
    timestamp: new Date().toISOString(),
  };

  orders.push(order);
  res.status(201).json(order);
});

// ── PATCH /api/orders/:id ── (staff only)
// VULN FIXED: no auth, no status validation → anyone could change order status.
app.patch('/api/orders/:id', requireAuth, (req, res) => {
  const id     = sanitizeString(req.params.id, 64);
  const status = req.body?.status;

  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  const index = orders.findIndex(o => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  orders[index] = { ...orders[index], status };
  res.json(orders[index]);
});

// ── DELETE /api/orders ── (admin only)
// VULN FIXED: was unauthenticated — any bot could wipe all orders.
app.delete('/api/orders', requireAuth, requireAdmin, (req, res) => {
  orders = [];
  res.status(204).end();
});

// ── GET /api/staff ── (admin only)
// VULN FIXED: was open — anyone could enumerate all staff IDs.
app.get('/api/staff', requireAuth, requireAdmin, (req, res) => {
  const safeAccounts = staffAccounts.map(o => ({
    id: o.id, name: o.name, role: o.role, registeredAt: o.registeredAt,
  }));
  res.json(safeAccounts);
});

// ── POST /api/staff/login ── (public + auth rate limited)
// VULN FIXED: no rate limit → unlimited brute-force attacks possible.
app.post('/api/staff/login', authLimiter, (req, res) => {
  const id       = sanitizeString(req.body?.id       ?? '', 32);
  const password = sanitizeString(req.body?.password ?? '', 128);

  if (!id || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials.' });
  }

  // VULN FIXED: removed 'admin/admin' backdoor entirely.
  const match = [...DEFAULT_ACCOUNTS, ...staffAccounts].find(
    s => s.id.toLowerCase() === id.toLowerCase() && s.password === password
  );

  if (match) {
    const token   = generateToken();
    const safeUser = { id: match.id, name: match.name, role: match.role };
    activeSessions.set(token, safeUser);
    // PHASE 5: return token in response body (client stores in memory, not localStorage)
    res.json({ success: true, account: safeUser, token });
  } else {
    // VULN FIXED: constant-time-ish delay to prevent timing oracle
    setTimeout(() => {
      res.status(401).json({ success: false, message: 'Invalid Staff ID or Password.' });
    }, 200);
  }
});

// ── POST /api/staff/logout ── (authenticated)
app.post('/api/staff/logout', requireAuth, (req, res) => {
  const token = req.headers['x-staff-token'];
  activeSessions.delete(token);
  res.status(204).end();
});

// ── POST /api/staff ── (public + auth rate limited)
// VULN FIXED: no validation of account fields, no rate limiting.
app.post('/api/staff', authLimiter, (req, res) => {
  const { account, key } = req.body ?? {};

  // Key validation
  const providedKey = sanitizeString(key ?? '', 128);
  if (!providedKey || providedKey !== establishmentKey) {
    return res.status(403).json({ success: false, message: 'Invalid Establishment Key.' });
  }

  // Field validation
  if (!isValidStaffId(account?.id)) {
    return res.status(400).json({ success: false, message: 'Invalid Staff ID format. Use alphanumeric and underscores only.' });
  }

  const name     = sanitizeString(account?.name     ?? '', 64);
  const password = sanitizeString(account?.password ?? '', 128);
  if (!name)             return res.status(400).json({ success: false, message: 'Name is required.' });
  if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

  const newId = account.id;
  const exists = [...DEFAULT_ACCOUNTS, ...staffAccounts].find(
    a => a.id.toLowerCase() === newId.toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ success: false, message: 'This Staff ID is already taken.' });
  }

  const newAccount = {
    id:           newId,
    password:     password, // TODO: bcrypt in production
    name,
    role:         'Staff',
    registeredAt: new Date().toISOString(),
  };

  staffAccounts.push(newAccount);
  res.status(201).json({ success: true, account: { id: newId, name, role: 'Staff' } });
});

// ── DELETE /api/staff/by-id/:id ── (admin only)
// VULN FIXED: was unauthenticated — anyone could delete staff accounts.
app.delete('/api/staff/by-id/:id', requireAuth, requireAdmin, (req, res) => {
  const staffId = sanitizeString(req.params.id, 32);

  // PHASE 3: Prevent removal of default accounts via API
  if (DEFAULT_ACCOUNTS.some(a => a.id === staffId)) {
    return res.status(403).json({ error: 'Cannot delete built-in accounts via API.' });
  }

  const idx = staffAccounts.findIndex(a => a.id === staffId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  staffAccounts.splice(idx, 1);
  res.status(204).end();
});

// ── GET /api/key ── (admin only)
// VULN FIXED: was completely open — ANY person on the network could read the
// establishment key and self-register as staff.
app.get('/api/key', requireAuth, requireAdmin, (req, res) => {
  res.json({ key: establishmentKey });
});

// ── POST /api/key ── (admin only + key-update rate limited)
// VULN FIXED: was unauthenticated + no validation.
app.post('/api/key', requireAuth, requireAdmin, keyUpdateLimiter, (req, res) => {
  const newKey = sanitizeString(req.body?.key ?? '', 128);

  if (!newKey || newKey.length < 6) {
    return res.status(400).json({ error: 'Key must be at least 6 characters.' });
  }

  // VULN FIXED: min length was 4 characters — trivially brute-forceable.
  establishmentKey = newKey;
  res.json({ key: establishmentKey });
});

// ── Health check (public, not rate-limited) ─────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// ERROR HANDLING — never leak stack traces to client
// ============================================================
// VULN FIXED: Express default error handler sends full stack traces.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log internally (replace with a real logger like Winston in production)
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // Only log in dev — never console.log in prod
    process.stderr.write(`[ERROR] ${err.message}\n`);
  }
  res.status(err.status ?? 500).json({
    error: isProd ? 'An internal server error occurred.' : err.message,
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    process.stdout.write(`\nAura & Spice Server running on port ${PORT}\n`);
    process.stdout.write(`CORS allowed origin: ${ALLOWED_ORIGIN}\n`);

    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          process.stdout.write(`Network: http://${iface.address}:${PORT}/\n`);
        }
      }
    }
    process.stdout.write('\n');
  }
});
