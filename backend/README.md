# TaskFlow API

Express 4 API backed by PostgreSQL. It provides JWT authentication, user-owned
task CRUD, and role-protected read-only administration endpoints.

## Setup

Create `backend/.env` with `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, and
`FRONTEND_URL`, then run:

```bash
npm install
npm start
```

Tables and additive admin columns/indexes are initialized on startup. Existing
databases can instead apply `migration_add_admin.sql` manually with `psql`.

## First administrator

Register normally, then promote the trusted account from PostgreSQL:

```sql
UPDATE users SET role = 'admin' WHERE employee_id = 'EMP1024';
```

Public registration cannot assign roles. Admin APIs first validate the JWT and
then load the current role from the database on every request.

## Checks

```bash
npm run check
npm test
```
