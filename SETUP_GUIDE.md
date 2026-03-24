# Setup & Deployment Guide

Complete guide for setting up and deploying the Institute Management System Backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup](#local-setup)
3. [MongoDB Setup](#mongodb-setup)
4. [Running Locally](#running-locally)
5. [Testing](#testing)
6. [Vercel Deployment](#vercel-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js (v14 or higher) - [Download](https://nodejs.org)
- npm (comes with Node.js)
- MongoDB database (local or cloud)
- Git (for version control)
- Vercel account (for deployment) - [Sign Up](https://vercel.com)
- Text editor (VS Code recommended)

### Verify Installation

```bash
node --version  # Should be v14+
npm --version   # Should be v6+
git --version   # Should show version
```

---

## Local Setup

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd institute-project
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **nodemon** - Development tool (dev dependency)

### 3. Setup Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your MongoDB connection string and JWT secret:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/institute-db?retryWrites=true&w=majority
JWT_SECRET=your_secure_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

---

## MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create Project**
   - Create a new project
   - Name it "Institute Management System"

3. **Create Cluster**
   - Choose free tier (M0)
   - Select your region
   - Wait for cluster creation (usually 1-3 minutes)

4. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Select Node.js driver
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `institute-db`

5. **Create Database User**
   - Go to Database Access
   - Add new database user
   - Username: admin
   - Password: strong_password
   - Add user

6. **Allow Network Access**
   - Go to Network Access
   - Add your IP address or allow 0.0.0.0/0 (from anywhere)

### Option 2: Local MongoDB

1. **Install MongoDB**
   - [Download Community Edition](https://www.mongodb.com/try/download/community)
   - Follow installation guide for your OS

2. **Start MongoDB Service**

   **Windows:**
   ```bash
   net start MongoDB
   ```

   **macOS (with Homebrew):**
   ```bash
   brew services start mongodb-community
   ```

   **Linux:**
   ```bash
   sudo systemctl start mongod
   ```

3. **Connection String**
   ```
   MONGO_URI=mongodb://localhost:27017/institute-db
   ```

---

## Running Locally

### Development Mode (with auto-reload)

```bash
cd backend
npm run dev
```

Output should show:
```
✅ Server is running on http://localhost:5000
📚 Institute Management System Backend
🌍 API Documentation: See README.md
🚀 Health check: GET http://localhost:5000/api/health
```

### Production Mode

```bash
cd backend
npm start
```

### Test the Server

Open another terminal and test:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "password": "test123"
  }'
```

Or use [Postman](https://www.postman.com) to test the API endpoints.

---

## Testing

### 1. Test Authentication

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "password": "adminpass123",
    "role": "admin"
  }'
```

Save the returned token for next tests.

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "212myashraj@gmail.com",
    "password": "adminpass123"
  }'
```

### 2. Test Courses (Admin Only)

Create a course:
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Web Development",
    "description": "Learn web development",
    "price": 5000
  }'
```

Get all courses:
```bash
curl http://localhost:5000/api/courses
```

### 3. Test Contact Form

Submit contact:
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "message": "I have a question about the Python course"
  }'
```

### 4. Test Admin Endpoints

Get dashboard stats:
```bash
curl http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Get all users:
```bash
curl http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Vercel Deployment

### Step 1: Prepare Your Code

1. Create `.gitignore` file (already provided)
2. Ensure `vercel.json` is configured (already provided)
3. Ensure `.env.example` is in the repo (already provided)

### Step 2: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Institute Management System Backend"

# Add GitHub remote
git remote add origin https://github.com/yourusername/institute-project.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow Prompts**
   - Set project name
   - Confirm project path
   - Configure environment variables

#### Option B: Using Web Interface

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: Leave empty
   - **Install Command**: `cd backend && npm install`
   - **Output Directory**: Leave empty
5. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your secure secret key
6. Click "Deploy"

### Step 4: Set Environment Variables

1. Go to Vercel project settings
2. Click "Environment Variables"
3. Add:
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secure secret key

### Step 5: Test Deployment

```bash
# Your Vercel URL will be shown
# Example: https://institute-api.vercel.app

# Test health check
curl https://institute-api.vercel.app/api/health

# Test register
curl -X POST https://institute-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "212myashraj@gmail.com",
    "password": "test123"
  }'
```

---

## Troubleshooting

### Issue: "Cannot find module 'mongoose'"

**Solution:**
```bash
cd backend
npm install
```

### Issue: "MongoDB connection failed"

**Check:**
- MongoDB URI is correct
- Network access is allowed in MongoDB Atlas
- MongoDB service is running (if local)
- Username and password are correct

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Kill process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm start
```

### Issue: "JWT token is invalid"

**Check:**
- Token is correctly passed in Authorization header
- Token hasn't expired
- JWT_SECRET matches the one used to create the token

### Issue: "CORS error in frontend"

**Solution: Update CORS in `api/index.js`**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend.com'],
  credentials: true
}));
```

### Issue: "Vercel deployment failed"

**Check:**
- `vercel.json` is correctly formatted
- All dependencies are in `package.json`
- Environment variables are set
- No build errors in logs

**View Logs:**
- Go to Vercel dashboard
- Click project
- Click "Deployments"
- View build logs

### Issue: "Database connection timeout on Vercel"

**Solution:**
- Check MongoDB connection string (should allow all IPs: 0.0.0.0/0)
- Ensure MONGO_URI environment variable is set
- Add IP whitelist in MongoDB Atlas if needed

---

## Development Tips

### Use Postman for API Testing

1. Download [Postman](https://www.postman.com/downloads/)
2. Import collection or create new requests
3. Set environment variable for token
4. Test all endpoints

### Common npm Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Install a package
npm install package-name

# Install dev package
npm install -D package-name

# Update packages
npm update

# Check outdated packages
npm outdated
```

### View Log Files

```bash
# Terminal output
# Usually shown in console

# Vercel logs
# Available in Vercel dashboard under "Logs" tab
```

---

## Security Checklist

- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Use MongoDB Atlas with IP whitelisting
- [ ] Enable CORS for your frontend domain only
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated (`npm update`)
- [ ] Use environment variables for sensitive data
- [ ] Implement rate limiting (future enhancement)
- [ ] Add input validation (already implemented)
- [ ] Monitor error logs regularly

---

## Next Steps

1. **Frontend Development**
   - Create React/Vue/Angular app
   - Use API endpoints documented in API_REFERENCE.md
   - Connect to this backend

2. **Additional Features**
   - Email notifications
   - Payment integration
   - Student enrollment
   - Course reviews
   - Search functionality

3. **Performance Optimization**
   - Add caching
   - Optimize database queries
   - Add API rate limiting
   - Implement pagination

4. **Monitoring**
   - Setup error tracking (Sentry)
   - Add analytics
   - Monitor API performance
   - Setup alerts

---

## Support & Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Guide](https://mongoosejs.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [JWT Guide](https://jwt.io/introduction)

---

## Version History

- v1.0.0 - Initial release with core features
  - User authentication
  - Course management
  - Contact form
  - Admin dashboard
  - Vercel deployment ready
