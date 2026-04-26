const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static html/css/js from the project root
app.use(express.static(path.join(__dirname)));

// --- In-Memory Data Store ---
// Note: Using in-memory array for orders ensures fast testing but will wipe on server restart.
let orders = [];
let staffAccounts = [];
let establishmentKey = 'AURA2024';

// DEFAULT ACCOUNTS STORED SECURELY ON SERVER
const DEFAULT_ACCOUNTS = [
  { id: 'STAFF001', password: 'aura2024', name: 'Chef Rajan', role: 'Chef' },
  { id: 'STAFF002', password: 'spice2024', name: 'Manager Priya', role: 'Manager' },
  { id: 'STAFF003', password: 'kitchen2024', name: 'Sous Chef Arjun', role: 'Sous Chef' },
  { id: 'admin', password: 'admin', name: 'Administrator', role: 'Admin' },
];

// ====== REST API ENDPOINTS ======

// GET /api/orders - Get all orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// GET /api/orders/:id - Get specific order by ID
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  res.json(order || {});
});

// POST /api/orders - Submit a new order
app.post('/api/orders', (req, res) => {
  const order = req.body;
  orders.push(order);
  res.status(201).json(order);
});

// PATCH /api/orders/:id - Update order status
app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const index = orders.findIndex(o => o.id === id);
  if (index > -1) {
    orders[index].status = status;
    res.json(orders[index]);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

// DELETE /api/orders - Clear all orders
app.delete('/api/orders', (req, res) => {
  orders = [];
  res.status(204).end();
});


// GET /api/staff - Get registered staff accounts (STRIPPED PASSWORDS)
app.get('/api/staff', (req, res) => {
  const safeAccounts = staffAccounts.map(o => ({
    id: o.id, name: o.name, role: o.role, registeredAt: o.registeredAt
  }));
  res.json(safeAccounts);
});

// POST /api/staff/login - Secure Server-Side Login
app.post('/api/staff/login', (req, res) => {
  const { id, password } = req.body;
  const match = [...DEFAULT_ACCOUNTS, ...staffAccounts].find(
    s => s.id.toLowerCase() === id.toLowerCase() && s.password === password
  );

  if (match) {
    // Return account data safely without password
    const safeUser = { id: match.id, name: match.name, role: match.role };
    res.json({ success: true, account: safeUser });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Staff ID or Password' });
  }
});

// POST /api/staff - Register a new staff account (WITH SERVER-SIDE KEY VERIFICATION)
app.post('/api/staff', (req, res) => {
  const { account, key } = req.body;
  if (!key || key !== establishmentKey) {
    return res.status(403).json({ success: false, message: '🔑 Invalid Establishment Key — contact your admin' });
  }

  // Check duplicate ID
  const exists = [...DEFAULT_ACCOUNTS, ...staffAccounts].find(a => a.id.toLowerCase() === account.id.toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, message: '❌ This Staff ID is already taken' });
  }

  staffAccounts.push(account);
  res.status(201).json({ success: true, account: { id: account.id, name: account.name, role: account.role } });
});

// DELETE /api/staff/by-id/:id - Delete a staff account by stable ID
app.delete('/api/staff/by-id/:id', (req, res) => {
  const staffId = req.params.id;
  const idx = staffAccounts.findIndex(a => a.id === staffId);
  if (idx > -1) {
    staffAccounts.splice(idx, 1);
    res.status(204).end();
  } else {
    res.status(404).json({ message: 'Account not found' });
  }
});


// GET /api/key - Get the establishment key for registration checks
app.get('/api/key', (req, res) => {
  res.json({ key: establishmentKey });
});

// POST /api/key - Update the establishment key
app.post('/api/key', (req, res) => {
  const { key } = req.body;
  if(key) establishmentKey = key;
  res.json({ key: establishmentKey });
});

const os = require('os');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍽️  Aura & Spice Server is running!\n`);
  console.log(`🏠 Home Page:     http://localhost:${PORT}`);
  console.log(`👨‍🍳 Staff Portal:  http://localhost:${PORT}/staff.html`);
  console.log(`🛒 QR Order Page: http://localhost:${PORT}/order.html?table=01\n`);

  console.log(`📱 TO TEST ON YOUR PHONE:`);
  console.log(`   Connect your phone to the same Wi-Fi and open one of these links:`);
  
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   👉 http://${iface.address}:${PORT}/`);
      }
    }
  }
  console.log();
});
