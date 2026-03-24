# Institute Management System Backend

A complete backend solution for an institute management system built with Node.js, Express, MongoDB, and Mongoose. Fully compatible with Vercel serverless deployment.

## Features

- **User Authentication**: Register and login with JWT tokens
- **Course Management**: Create, update, and delete courses (admin only)
- **Contact Form**: Submit and manage contact requests
- **Admin Dashboard**: Comprehensive admin panel for managing users and contacts
- **Role-Based Access**: Student and admin roles with proper authorization
- **MongoDB Integration**: Full Mongoose integration with data validation
- **Vercel Compatible**: Serverless deployment ready

## Project Structure

```
backend/
├── api/
│   ├── index.js              # Express app setup
│   ├── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Course.js         # Course model
│   │   └── Contact.js        # Contact model
│   └── routes/
│       ├── auth.js           # Authentication routes
│       ├── courses.js        # Course management routes
│       ├── contact.js        # Contact form routes
│       └── admin.js          # Admin dashboard routes
├── package.json
└── .env                      # Environment variables
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or MongoDB Atlas)
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd institute-project
```

2. Install dependencies
```bash
cd backend
npm install
```

3. Create .env file
```bash
cp .env.example .env
```

4. Update .env with your credentials
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_key
PORT=5000
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"  // optional, defaults to "student"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Course Routes (`/api/courses`)

#### Get All Courses
```http
GET /api/courses
```

Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "course_id",
      "title": "Web Development",
      "description": "Learn web development",
      "price": 5000,
      "createdBy": {
        "_id": "user_id",
        "name": "Admin Name",
        "email": "admin@example.com"
      },
      "createdAt": "2024-03-24T10:00:00.000Z"
    }
  ]
}
```

#### Get Single Course
```http
GET /api/courses/:id
```

#### Create Course (Admin Only)
```http
POST /api/courses
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Web Development",
  "description": "Learn web development from scratch",
  "price": 5000
}
```

#### Update Course (Admin Only)
```http
PUT /api/courses/:id
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Advanced Web Development",
  "description": "Updated description",
  "price": 6000
}
```

#### Delete Course (Admin Only)
```http
DELETE /api/courses/:id
Authorization: Bearer jwt_token_here
```

### Contact Routes (`/api/contact`)

#### Submit Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I have a question about your courses"
}
```

Response:
```json
{
  "success": true,
  "message": "Your message has been received. We will contact you soon!",
  "data": {
    "_id": "contact_id",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I have a question about your courses",
    "status": "new",
    "createdAt": "2024-03-24T10:00:00.000Z"
  }
}
```

#### Get All Contacts
```http
GET /api/contact
GET /api/contact?page=1&limit=10
```

#### Get Single Contact
```http
GET /api/contact/:id
```

#### Update Contact Status
```http
PUT /api/contact/:id
Content-Type: application/json

{
  "status": "resolved"  // "new", "read", or "resolved"
}
```

#### Delete Contact
```http
DELETE /api/contact/:id
```

### Admin Routes (`/api/admin`)

All admin routes require Authorization header with admin token.

#### Get Dashboard Statistics
```http
GET /api/admin/dashboard/stats
Authorization: Bearer admin_jwt_token_here
```

Response:
```json
{
  "success": true,
  "data": {
    "totalUsers": 10,
    "totalStudents": 8,
    "totalAdmins": 2,
    "totalCourses": 5,
    "totalContacts": 15,
    "newContacts": 3
  }
}
```

#### Get All Users
```http
GET /api/admin/users
GET /api/admin/users?page=1&limit=10&role=student
Authorization: Bearer admin_jwt_token_here
```

#### Get Single User
```http
GET /api/admin/users/:id
Authorization: Bearer admin_jwt_token_here
```

#### Update User Role
```http
PUT /api/admin/users/:id/role
Authorization: Bearer admin_jwt_token_here
Content-Type: application/json

{
  "role": "admin"  // "student" or "admin"
}
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer admin_jwt_token_here
```

#### Get All Contact Requests
```http
GET /api/admin/contacts
GET /api/admin/contacts?page=1&limit=10&status=new
Authorization: Bearer admin_jwt_token_here
```

#### Get Single Contact Request
```http
GET /api/admin/contacts/:id
Authorization: Bearer admin_jwt_token_here
```

#### Update Contact Status
```http
PUT /api/admin/contacts/:id/status
Authorization: Bearer admin_jwt_token_here
Content-Type: application/json

{
  "status": "resolved"  // "new", "read", or "resolved"
}
```

#### Delete Contact Request
```http
DELETE /api/admin/contacts/:id
Authorization: Bearer admin_jwt_token_here
```

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or with nodemon for development:
```bash
npm install -D nodemon
npx nodemon backend/api/index.js
```

The server will run on `http://localhost:5000`

## Deploying to Vercel

### Prerequisites
- Vercel account (https://vercel.com)
- MongoDB Atlas account or MongoDB connection string

### Steps

1. Create a GitHub repository and push your code

2. Go to https://vercel.com and sign in

3. Click "New Project" and select your repository

4. Configure your project:
   - Framework: Node.js
   - Root Directory: `/` (or your project root)

5. Add environment variables:
   - Click "Environment Variables"
   - Add `MONGO_URI`: Your MongoDB connection string
   - Add `JWT_SECRET`: Your secure secret key

6. Click "Deploy"

Alternatively, deploy using Vercel CLI:

```bash
npm install -g vercel
vercel
```

## API Testing

### Using curl

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

### Using Postman

1. Import the API collection
2. Set the base URL: `http://localhost:5000`
3. For authenticated requests, add the token in the Authorization header: `Bearer YOUR_JWT_TOKEN`

## Security Considerations

- **JWT Secret**: Change the default JWT_SECRET in production
- **MongoDB URI**: Never commit real credentials, use environment variables
- **CORS**: Configure CORS properly for your frontend domain
- **Password Hashing**: All passwords are hashed using bcrypt
- **Input Validation**: All inputs are validated using Mongoose schemas

## Error Handling

All API responses follow a consistent format:

Success:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Environment Variables

- `MONGO_URI`: MongoDB connection string (required)
- `JWT_SECRET`: Secret key for JWT signing (recommended to change)
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)

## Technologies Used

- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing
- **CORS**: Cross-Origin Resource Sharing
- **Vercel**: Serverless deployment

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

## Future Enhancements

- Email notifications
- Payment integration
- Student enrollment system
- Course reviews and ratings
- Automated backups
- Logging and monitoring
- Rate limiting
- API documentation with Swagger/OpenAPI
