# TaskFlow

A full-stack **task management web application** built with React, Node.js/Express, and MySQL.

![TaskFlow Dashboard](https://img.shields.io/badge/status-active-brightgreen) ![React](https://img.shields.io/badge/React-19-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MySQL](https://img.shields.io/badge/Database-MySQL-orange)

## ✨ Features

- 🔐 **Secure Authentication** — Register & login with Employee ID + password (bcrypt hashed)
- ✅ **Full Task CRUD** — Create, read, update, delete tasks with title, description, priority & due date
- 📊 **Live Dashboard** — Real-time stats: total, pending, in-progress, completed, overdue & completion %
- 📈 **Progress Bar** — Visual completion tracking
- 🔍 **Search & Filter** — Filter by status, priority; search by keyword
- 🔃 **Sort Tasks** — By due date, priority, status, or newest
- 🔔 **Toast Notifications** — Instant feedback on every action
- 🗑️ **Confirm Modal** — Styled delete confirmation (no ugly browser dialogs)
- ⌨️ **Keyboard Shortcuts** — `Ctrl+N` new task, `Esc` cancel
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop
- 🌙 **Premium Dark Theme** — Glassmorphism, animated gradients, Inter font

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | Vanilla CSS (custom dark theme) |
| Backend | Node.js + Express 4 |
| Database | MySQL (via mysql2/promise) |
| Auth | bcryptjs + express-session |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL (XAMPP, MySQL Workbench, or any MySQL server)

### 1. Clone the repo
```bash
git clone https://github.com/krishxwebdev/TaskFlow-.git
cd taskflow
```

### 2. Set up the database
```bash
# In your MySQL client, run:
mysql -u root -p < backend/schema.sql
```

### 3. Configure the backend
```bash
cd backend
cp .env.example .env
# Edit .env — set your DB_HOST, DB_USER, DB_PASSWORD, DB_PORT
```

### 4. Start the backend
```bash
cd backend
npm install
npm start
# → Running on http://localhost:5000
```

### 5. Start the frontend
```bash
cd frontend
npm install
npm run dev
# → Open http://localhost:5173
```

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── middleware/            # requireAuth guard
│   ├── routes/
│   │   ├── auth.js            # /api/auth/* — register, login, logout, me
│   │   └── todo.js            # /todo/* — CRUD + summary
│   ├── schema.sql             # Database schema
│   ├── server.js              # Express app entry point
│   └── .env.example
└── frontend/
    └── src/
        ├── api/api.js         # All fetch wrappers
        ├── components/
        │   ├── Dashboard.jsx  # Main view — data + state owner
        │   ├── Login.jsx      # Register / Sign in
        │   ├── StatsCards.jsx # Summary stats + progress bar
        │   ├── TaskForm.jsx   # Add / Edit task form
        │   ├── TaskItem.jsx   # Single task row
        │   ├── TaskList.jsx   # Task list + empty state
        │   ├── Toast.jsx      # Toast notification system
        │   └── ConfirmModal.jsx # Delete confirmation modal
        ├── App.jsx
        └── main.jsx
```

## 🔑 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ✗ | Create account |
| POST | `/api/auth/login` | ✗ | Login |
| GET | `/api/auth/me` | ✗ | Session check |
| POST | `/api/auth/logout` | ✗ | Logout |
| GET | `/todo` | ✓ | List tasks (filterable) |
| POST | `/todo` | ✓ | Create task |
| GET | `/todo/summary` | ✓ | Dashboard stats |
| PUT | `/todo/:id` | ✓ | Update task |
| PUT | `/todo/:id/status` | ✓ | Update status |
| DELETE | `/todo/:id` | ✓ | Delete task |

## 🌐 Deployment

See [deployment guide](#) for instructions on deploying to Vercel + Render + PlanetScale.

---

Made with ❤️ by [krishxwebdev](https://github.com/krishxwebdev)
