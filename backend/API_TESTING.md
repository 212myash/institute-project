# API Testing Guide (Local + Postman/cURL)

## 1. Start Backend Locally

From `backend/`:

```bash
npm install
npm start
```

Expected:
- Server starts on `http://localhost:5000`
- `GET /` returns `API Running`
- `GET /api/health` returns success JSON

## 2. Test Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo User",
    "email": "demo@example.com",
    "password": "123456",
    "role": "student"
  }'
```

Success response:
- `201 Created`
- `{ success: true, message, user }`

Error examples:
- `400` missing fields
- `409` duplicate email

## 3. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "123456"
  }'
```

Success response:
- `200 OK`
- `{ success: true, message, user }`

Error examples:
- `400` missing fields
- `401` invalid credentials

## 4. Test Admin Requests

```bash
curl http://localhost:5000/api/admin/requests
```

## 5. Common MongoDB Debug Checklist

- Ensure `MONGO_URI` is set in environment variables.
- Ensure URI starts with `mongodb+srv://` or `mongodb://`.
- In MongoDB Atlas, allow your IP in Network Access.
- Verify database user credentials.
- Watch server logs:
  - `Mongoose connected to MongoDB`
  - `Mongoose connection error: ...`
  - `Mongoose disconnected from MongoDB`
