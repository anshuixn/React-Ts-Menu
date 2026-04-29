# AuraSpice Realtime Web Experience

AuraSpice is a premium, real-time, multi-device web application designed for seamless restaurant management. It features a stunning customer-facing menu and tracking interface, alongside a secure, serverless-ready staff portal for live order management.

## 👶 How to Run the Website (Baby Steps)

Follow these simple, step-by-step instructions to get the website running on your own computer. You don't need to be an expert!

### Step 1: Open your Terminal
- On a Mac: Press `Cmd + Space`, type "Terminal", and hit Enter.
- On Windows: Press the Windows key, type "Command Prompt" or "PowerShell", and hit Enter.

### Step 2: Make sure you have Node.js installed
Type this command in your terminal and press Enter:
```bash
node -v
```
If you see a version number (like `v18.x.x` or higher), you are good to go! If you get an error, please download and install Node.js from [nodejs.org](https://nodejs.org/).

### Step 3: Go to the project folder
In your terminal, navigate to the folder where you saved this project. For example:
```bash
cd path/to/your/folder/AuraSpice-React
```

### Step 4: Install the required packages
We need to download the building blocks the project needs to run. Type this command and press Enter:
```bash
npm install
```
*(Wait a few moments for the download bar to finish. It's downloading all the necessary code libraries.)*

### Step 5: Start the website!
Now, start the local server by typing this command and hitting Enter:
```bash
npm run dev
```

### Step 6: Open it in your browser
Once the command finishes, it will show you a local web address. It usually looks like this:
`http://localhost:5173/`

Hold down `Cmd` (Mac) or `Ctrl` (Windows) and click that link, or simply copy and paste it into your Chrome/Safari browser. 

**Congratulations! The AuraSpice website is now running on your computer! 🎉**

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** CSS (Antigravity Design System — Charcoal & Gold, Glassmorphism)
- **Animations:** Framer Motion, Canvas Confetti
- **Backend/Database:** Supabase (PostgreSQL), Supabase Realtime
- **Serverless API:** Vercel Serverless Functions (`/api/*`)
- **Authentication:** `bcrypt` password hashing, Cryptographically secure session tokens

## Database & Backend Setup (For Advanced Features)

To enable the live realtime order tracking and the secure staff portal, you must connect the app to a Supabase database.

### 1. Set up Environment Variables
1. Create a new file in the root folder of this project and name it `.env.local`
2. Add the following lines to it, replacing the placeholder text with your actual Supabase keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
*(Note: The `SUPABASE_SERVICE_ROLE_KEY` is kept secure and is only used by the Vercel backend functions).*

### 2. Set up the Database Schema
1. Log in to your [Supabase](https://supabase.com/) project dashboard.
2. Click on the **SQL Editor** tab on the left menu.
3. Open the `supabase/schema.sql` file located in this project folder.
4. Copy all the text inside it, paste it into the Supabase SQL Editor, and click "Run".
*(This automatically creates all the tables, security rules, and the default admin account needed to run the app).*

## Deployment

This application is designed to be deployed seamlessly on **Vercel**. 
The `vercel.json` file is pre-configured to handle single-page application routing and set secure HTTP headers.

1. Connect your GitHub repository to Vercel.
2. Ensure the **Framework Preset** is set to `Vite`.
3. Add the following Environment Variables in your Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click Deploy!

## Usage Guide

- **Customer View:** Navigate to the homepage to explore the menu, add items to the cart, and place an order. Once an order is placed, a premium `StatusDrawer` will appear, offering real-time tracking of the order's journey from the kitchen to your table.
- **Staff Portal:** Navigate to `/staff` (or click "Staff Portal" in the mobile menu). 
  - **Default Admin Login:** ID: `admin`, Password: `admin` *(Change this immediately in production!)*.
  - The Staff Dashboard features a drag-and-drop Kanban board that instantly syncs across all devices. When a staff member moves an order to a new status, the customer's phone will automatically update via Supabase Realtime.
