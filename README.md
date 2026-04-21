# Aura & Spice Restaurant Portal

A modern, real-time restaurant management and ordering web application. Featuring a premium dark-mode aesthetic with fluid touch gestures, a dynamic Kanban staff board, and a fully interactive QR-based ordering system.

This project is built using a decoupled architecture:
- **Frontend**: A React + TypeScript Single Page Application (SPA), styled with vanilla CSS for maximum performance, and bundled with Vite.
- **Backend**: A lean Node.js + Express backend providing RESTful endpoints and real-time polling synchronization for the staff dashboard.

---

## 🚀 Getting Started

The project requires running both the backend server and the frontend client simultaneously.

### 1. Start the Backend Server

The backend runs on **Port 3000** and serves the API for ordering, authentication, and live status syncing.

```bash
# From the root directory (where server.js lives)
# 1. Install backend dependencies
npm install

# 2. Start the server
npm start
```
*You should see a success message indicating the server is running on `http://localhost:3000`.*

### 2. Start the React Frontend

The frontend is a Vite project located in the `AuraSpice-React` folder. The Vite dev server will proxy any `/api` requests to your backend automatically.

```bash
# Open a NEW terminal window/tab
# 1. Navigate to the React folder
cd AuraSpice-React

# 2. Install frontend dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

---

## 📱 Using the App

Once both servers are running, access the local links provided by Vite (typically `http://localhost:5173`):

### 1. The Customer Menu & Ordering Portal
- **URL**: `http://localhost:5173/order?table=01` (or just navigate to `/` and click the order button).
- Add items to your cart.
- You can swipe right on the cart drawer (on touchscreen/mobile view) to test fluid touch gestures!
- Click **"Place Order"** to send it to the kitchen.

### 2. The Kitchen / Staff Portal
- **URL**: `http://localhost:5173/staff`
- **Default Login:**
  - **ID:** `admin`
  - **Password:** `admin`
- Inside, you will see a real-time **Kanban Board** with orders popping up instantly as they are placed by customers.
- **Interactive Drag & Drop**: You can drag an order card from "Pending" to "In Progress" or click the status progression buttons.
- As an admin, check out the **"👥 Employees"** tab in the top navigation to add or remove staff members and view the Master Establishment Key.

---

## 🛠 Tech Stack Overview

- **Frontend Core:** React 18, TypeScript, React Router DOM
- **State Management:** React Context API (Auth), Zustand-inspired Hooks (Cart)
- **Styling:** Custom "Antigravity" Vanilla CSS using CSS Variables, Glassmorphism, and responsive units.
- **Backend:** Node.js, Express, CORS
- **Tooling:** Vite, ESLint

## 📁 Repository Structure

```text
├── server.js              # The Express Backend API Server
├── package.json           # Backend dependencies and scripts
├── AuraSpice-React/       # The complete Frontend React App
│   ├── src/               # React Codebase (components, hooks, pages, types)
│   ├── package.json       # Frontend dependencies and Vite scripts
│   └── vite.config.ts     # Vite bundler, proxy configuration for /api
└── legacy/                # Archived Vanilla JS & HTML implementation
```
