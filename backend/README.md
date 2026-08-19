# TaskFlow — Setup Guide

A multi-user task management app: React frontend, Node/Express backend, MySQL database.

## Folder structure
```
taskflow/
  backend/     -> Node.js + Express API + MySQL
  frontend/    -> React (Vite) dashboard
```

## 1. Set up the database
Open Command Prompt in the `backend` folder and run:
```
mysql -u root -p < schema.sql
```
Enter your MySQL root password when asked. This creates the `taskflow` database
and its `users` and `tasks` tables.

## 2. Set up the backend
```
cd backend
copy .env.example .env
```
Open `.env` in Notepad and put your real MySQL password in `DB_PASSWORD`.

Then install and run:
```
npm install
npm start
```
You should see: `TaskFlow backend running on http://localhost:5000`
Leave this window open and running.

## 3. Set up the frontend
Open a **second** Command Prompt window (keep the backend one running):
```
cd frontend
npm install
npm run dev
```
It will print a URL, usually `http://localhost:5173` — open that in your browser.

## 4. Use the app
- Enter any username + employee ID -> you're automatically registered and logged in
- Add tasks, edit them, change their status, filter/search, delete them
- Stats update live at the top of the dashboard

## Troubleshooting
- "Cannot connect to MySQL" -> check your password in `.env` is correct, and that
  the MySQL service is running (search "Services" in Windows, look for MySQL80).
- "Port 5000 already in use" -> change `PORT` in `.env` to e.g. 5001, and update
  `BASE_URL` in `frontend/src/api/api.js` to match.
- CORS errors in browser console -> make sure backend is running on port 5000
  and frontend on port 5173 (the backend's cors() config expects that exact origin).
