# Quick Start Guide

Get the Institute Management System Backend up and running in 5 minutes!

## Prerequisites

- Node.js (v14+)
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- curl or [Postman](https://www.postman.com)

## 1. Setup (2 minutes)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB connection string
# (Open .env and update MONGO_URI and JWT_SECRET)
```

## 2. Start Server (30 seconds)

```bash
# Development with auto-reload
npm run dev

# Or production mode
npm start
```

You should see:
```
✅ Server is running on http://localhost:5000
```

## 3. Test API (2 minutes)

### Register Yash Raj

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "212myashraj@gmail.com",
    "password": "admin123",
    "role": "admin"
  }'
```

**Save the returned token** (you'll need it for admin endpoints)

### Create a Course

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

### Get All Courses

```bash
curl http://localhost:5000/api/courses
```

### Submit Contact Form

```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "message": "I have a question"
  }'
```

## 4. Verify Health

```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## 🎯 Next Steps

1. **Read Documentation**
   - [API_REFERENCE.md](API_REFERENCE.md) - Complete API endpoints
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup and deployment
   - [README.md](README.md) - Project overview

2. **Test with Postman**
   - Import `Institute_Management_API.postman_collection.json` into Postman
   - Set `base_url` variable to `http://localhost:5000`
   - Set `admin_token` variable with your admin token

3. **Build Your Frontend**
   - Use the API endpoints documented in API_REFERENCE.md
   - Example: Create React/Vue app and connect to this backend

4. **Deploy to Vercel**
   - Follow steps in [SETUP_GUIDE.md](SETUP_GUIDE.md#vercel-deployment)
   - Push code to GitHub
   - Deploy via Vercel

---

## 📝 Environment Variables

Create `.env` file in `backend/` directory:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/institute-db?retryWrites=true&w=majority
JWT_SECRET=your_secure_secret_key_here
PORT=5000
NODE_ENV=development
```

---

## 🐛 Troubleshooting

**Port 5000 already in use?**
```bash
PORT=5001 npm start
```

**MongoDB connection error?**
- Check MONGO_URI is correct
- Ensure network access is allowed in MongoDB Atlas
- Verify credentials

**Module not found error?**
```bash
npm install
```

---

## 📚 API Resources

| Feature | Method | Endpoint |
|---------|--------|----------|
| Register | POST | `/api/auth/register` |
| Login | POST | `/api/auth/login` |
| Get Courses | GET | `/api/courses` |
| Create Course | POST | `/api/courses` (admin) |
| Submit Contact | POST | `/api/contact` |
| Admin Dashboard | GET | `/api/admin/dashboard/stats` (admin) |

**See [API_REFERENCE.md](API_REFERENCE.md) for complete API documentation**

---

## 💡 Tips

✅ Keep your JWT_SECRET secure

✅ Use environment variables for sensitive data

✅ Test endpoints with Postman before building frontend

✅ Check MongoDB Atlas for data

✅ Monitor Vercel logs during deployment

---

## 🚀 Ready to Deploy?

See [SETUP_GUIDE.md](SETUP_GUIDE.md#vercel-deployment) for Vercel deployment instructions.

---

Need help? Check the documentation files or create an issue in your repository.
