# TaskFlow

A full-stack task management application for organizing work, tracking
progress, and managing deadlines through a responsive dashboard.

## Live Demo

[Open TaskFlow on Vercel](https://task-flow-kappa-vert.vercel.app/)

> The frontend is hosted on Vercel and communicates with a separately deployed
> Node.js API and PostgreSQL database.

## Features

- Account registration and login with employee ID and password
- Password hashing with bcrypt
- JWT authentication with seven-day tokens
- User-specific task data
- Create, read, update, and delete tasks
- Task priorities, descriptions, due dates, and statuses
- Dashboard totals for pending, in-progress, completed, and overdue tasks
- Completion-rate progress tracking
- Search and filter by status or priority
- Keyboard shortcuts for common actions
- Toast notifications and custom confirmation dialogs
- Responsive dark-themed interface

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Vanilla CSS |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL with `pg` |
| Authentication | JSON Web Tokens and bcryptjs |
| Frontend hosting | Vercel |

## Project Structure

```text
taskflow/
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection pool
│   │   └── initDb.js          # Automatic table initialization
│   ├── middleware/
│   │   └── requireAuth.js     # JWT authentication guard
│   ├── routes/
│   │   ├── auth.js            # Registration and login routes
│   │   └── todo.js            # Task CRUD and summary routes
│   ├── .env.example
│   ├── schema.sql
│   └── server.js
└── frontend/
    └── src/
        ├── api/api.js         # API client and JWT storage
        ├── components/        # Dashboard and task UI
        ├── App.jsx
        └── main.jsx
```

## Run Locally

### Prerequisites

- Node.js 18 or later
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/krishxwebdev/TaskFlow-.git
cd TaskFlow-
```

### 2. Configure PostgreSQL

Create a PostgreSQL database named `taskflow`. The backend automatically
creates the required `users` and `tasks` tables when it starts. You can also
apply the complete schema manually:

```bash
psql -d taskflow -f backend/schema.sql
```

### 3. Configure and run the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and configure it:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/taskflow
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

### 4. Configure and run the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## API Endpoints

| Method | Route | Authentication | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Create an account |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Optional | Validate the current token |
| `POST` | `/api/auth/logout` | No | Return a logout response |
| `GET` | `/todo` | Bearer token | List and filter the user's tasks |
| `POST` | `/todo` | Bearer token | Create a task |
| `GET` | `/todo/summary` | Bearer token | Retrieve dashboard statistics |
| `PUT` | `/todo/:id` | Bearer token | Update task details |
| `PUT` | `/todo/:id/status` | Bearer token | Update a task's status |
| `DELETE` | `/todo/:id` | Bearer token | Delete a task |

## Deployment

### Frontend

Deploy the `frontend` directory to Vercel with:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=<deployed-backend-url>`

### Backend

Deploy the `backend` directory to a Node.js hosting provider and configure:

```env
DATABASE_URL=<production-postgresql-url>
JWT_SECRET=<strong-production-secret>
NODE_ENV=production
FRONTEND_URL=https://task-flow-kappa-vert.vercel.app
```

The backend initializes its database tables on startup.

## Author

[krishxwebdev](https://github.com/krishxwebdev)
