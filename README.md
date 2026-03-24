# Shivam Computer Institute Management System

Shivam Computer Institute Management System is a full-stack web application designed to manage core institute operations, including student onboarding, course administration, attendance tracking, and contact request handling.

It includes a Node.js + Express backend, MongoDB database integration with Mongoose, and an HTML/CSS/JavaScript frontend.

## Proprietary Notice

This project is proprietary and not allowed to be reused or redistributed without permission.

## Project Features

- Student Registration & Login
- Admin Dashboard
- Course Management
- Attendance System
- Contact Form

## Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB Atlas, Mongoose
- Authentication Security: bcrypt password hashing
- Frontend: HTML, CSS, JavaScript
- Deployment: Vercel Serverless Functions

## Folder Structure

- backend/
  - api/
    - index.js (Express app entry for serverless)
    - db.js (Mongoose connection)
    - models/ (Mongoose models)
    - routes/ (API route modules)
  - server.js (local runtime entry)
  - package.json
  - .env (local secrets, not committed)
  - .env.example (safe template)
- frontend/
  - HTML/CSS/JS client code
- vercel.json (Vercel deployment routing)

## Installation and Local Setup

### 1. Clone Project

- git clone <your-repo-url>
- cd institute-project

### 2. Backend Setup

- cd backend
- npm install

### 3. Environment Variables

Create a local environment file:

- Copy backend/.env.example to backend/.env
- Fill real values:
  - MONGO_URI=your_mongodb_connection_string
  - JWT_SECRET=your_secure_secret
  - PORT=5000
  - NODE_ENV=development

Important:

- Never commit backend/.env
- Never expose MONGO_URI or JWT_SECRET publicly

### 4. Run Backend

- Development: npm run dev
- Production-style local run: npm start

Default URL:

- http://localhost:5000

## API Endpoints Overview

### Health

- GET /
- GET /api/health

### Auth

- POST /api/auth/register
- POST /api/auth/login

### Courses

- GET /api/courses
- POST /api/courses

### Contact

- POST /api/contact

### Admin

- GET /api/admin/users
- GET /api/admin/requests

### Attendance

- POST /api/attendance

## Security Notes

- Passwords are hashed using bcrypt before storage.
- Secrets must stay in environment variables only.
- Do not share or publish MONGO_URI or JWT_SECRET.
- Add server-side input validation for all payloads (recommended):
  - Validate email format
  - Enforce password strength policy
  - Validate ObjectId values and enum fields
  - Sanitize text inputs to prevent injection-style payloads

## Production-Ready Notes

- App is serverless-compatible for Vercel via module export in backend/api/index.js.
- Database connection is centralized in backend/api/db.js and uses process.env.MONGO_URI.
- API routing is configured through vercel.json under /api/*.
- Keep logs meaningful but avoid printing secrets.

## Vercel Deployment Instructions

### 1. Push Code to Git Provider

- Push the repository to GitHub (or supported provider).

### 2. Import Project in Vercel

- Open Vercel Dashboard.
- Click Add New Project.
- Import this repository.

### 3. Configure Environment Variables in Vercel

In Project Settings > Environment Variables, add:

- MONGO_URI = your MongoDB Atlas URI
- JWT_SECRET = your secure JWT secret
- NODE_ENV = production

Apply these variables at least to:

- Production
- Preview (optional but recommended)

### 4. Deploy

- Trigger deployment from dashboard.
- Verify endpoints after deploy:
  - /api/health
  - /api/auth/register
  - /api/auth/login

## Screenshots

Add screenshots here before client handover:

- Screenshot 1: Landing Page
- Screenshot 2: Student Dashboard
- Screenshot 3: Admin Dashboard
- Screenshot 4: Course Management
- Screenshot 5: Attendance View
- Screenshot 6: Contact/Enquiry Flow

## Client Delivery Checklist

- Confirm environment variables are set in Vercel.
- Confirm .env is excluded from Git.
- Confirm API health endpoint is reachable.
- Confirm MongoDB Atlas network access rules are correct.
- Confirm authentication and core modules work end-to-end.

## Author / Contact

For support, implementation transfer, or maintenance:

- Author: Shivam Computer Institute Engineering Team
- Contact: shivaminstitute317@gmail.com

## License

All Rights Reserved.
Refer to the LICENSE file for ownership and usage restrictions.
