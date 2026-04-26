# Aura & Spice — Restaurant Management Portal

A real-time, full-stack restaurant management system. Customers scan a QR code to browse the menu and place orders. Kitchen staff monitor and manage a live Kanban board of all incoming orders.

Built with a **decoupled architecture**:
- **Frontend** — React 18 + TypeScript SPA, bundled with Vite
- **Backend** — Node.js + Express REST API with in-memory order store

---

## 📁 Project Structure

```
Experiments/
├── server.js              # Express backend API (run this first)
├── package.json           # Backend dependencies
├── AuraSpice-React/       # React frontend (run separately)
│   ├── src/               # All React source code
│   ├── vite.config.ts     # Vite config with /api proxy to port 3000
│   └── package.json       # Frontend dependencies
├── assets/                # Shared media (menu images, tracker icons)
├── css/                   # Legacy CSS (reference only)
└── legacy/                # Archived Vanilla JS/HTML implementation
```

---

## 🚀 Quick Start

The project requires **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Start the Backend Server

> The backend runs on **port 3000**. It must be started **before** the frontend.

```bash
# From the root project directory (where server.js lives)
cd /path/to/Experiments

# Install backend dependencies (first time only)
npm install

# Start the server — choose either command:
node server.js
# OR
npm start
```

You should see:

```
🍽️  Aura & Spice Server is running!

🏠 Home Page:     http://localhost:3000
👨‍🍳 Staff Portal:  http://localhost:3000/staff.html
🛒 QR Order Page: http://localhost:3000/order.html?table=01
```

---

### Terminal 2 — Start the React Frontend

> The Vite dev server runs on **port 5173** and automatically proxies all `/api` requests to the backend on port 3000.

```bash
# Navigate to the React folder
cd AuraSpice-React

# Install frontend dependencies (first time only)
npm install

# Start the Vite development server
npm run dev
```

Then open → **http://localhost:5173**

---

## 🌐 App URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | Customer-facing home page |
| `http://localhost:5173/order?table=01` | Order menu (replace `01` with table number) |
| `http://localhost:5173/staff` | Staff kitchen portal (requires login) |

---

## 🔐 Staff Login Credentials

The following accounts are built-in and require **no registration**:

| Staff ID | Password | Role |
|----------|----------|------|
| `admin` | `admin` | Administrator |
| `STAFF001` | `aura2024` | Chef Rajan |
| `STAFF002` | `spice2024` | Manager Priya |
| `STAFF003` | `kitchen2024` | Sous Chef Arjun |

> **Admin** is the only account that can see the **👥 Employees** panel and manage staff.

---

## 🔑 Establishment Key

The Establishment Key is required to **register new staff accounts** from the Register tab on the login screen.

**Default Key:**
```
AURA2024
```

**To change the key:**
1. Log in as `admin`
2. Click **👥 Employees** in the top header
3. Scroll to the **Current Establishment Key** section
4. Enter a new key and click **Update Key**

> Share the key with new hires so they can self-register. Keep it secret from customers.

---

## 📱 Testing on a Phone

When the backend is running, it also prints your local network IP:

```
📱 TO TEST ON YOUR PHONE:
   Connect your phone to the same Wi-Fi and open one of these links:
   👉 http://192.168.x.x:3000/
```

For the React frontend over the network, start Vite with:

```bash
npm run dev -- --host
```

This exposes it on your local network so you can scan a QR code from a phone.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Core | React 18, TypeScript |
| Routing | React Router DOM |
| State | Context API (auth), useReducer (cart) |
| Styling | Vanilla CSS — "Antigravity" design system |
| Build Tool | Vite |
| Backend | Node.js, Express |
| Realtime | Polling every 2 seconds (no WebSocket needed) |
| Auth | Server-side credential check, sessionStorage session |

---

## ⚙️ Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Fetch all orders |
| `POST` | `/api/orders` | Place a new order |
| `PATCH` | `/api/orders/:id` | Update order status |
| `DELETE` | `/api/orders` | Clear all orders |
| `POST` | `/api/staff/login` | Authenticate a staff member |
| `GET` | `/api/staff` | List registered employees (no passwords) |
| `POST` | `/api/staff` | Register a new staff account (requires key) |
| `DELETE` | `/api/staff/by-id/:id` | Remove an employee by their Staff ID |
| `GET` | `/api/key` | Get the current establishment key |
| `POST` | `/api/key` | Update the establishment key |

> **Note:** The server uses an **in-memory data store**. All orders and registered staff are wiped when the server restarts. This is intentional for development/demo use.

---

## 🧪 Common Issues

| Problem | Fix |
|---------|-----|
| `Cannot reach backend server` on `/staff` | Backend isn't running — run `node server.js` in the root directory first |
| Orders not appearing on Kanban | Both servers must be running; Vite proxies `/api` to port 3000 |
| Login fails with correct credentials | Make sure you're using the credentials from the table above exactly (case-sensitive) |
| Register fails with "Invalid Key" | Use the establishment key `AURA2024` (or whatever the admin set it to) |
| Port 3000 already in use | Another process is using it — run `lsof -i :3000` then kill that process |
| Port 5173 already in use | Run `npm run dev -- --port 5174` to use a different port |
