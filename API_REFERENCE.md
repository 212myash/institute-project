# API Reference - Institute Management System

Complete API documentation for the Institute Management System Backend.

## Base URL

- **Local Development**: `http://localhost:5000`
- **Production (Vercel)**: `https://your-vercel-domain.vercel.app`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

All API responses follow this format:

### Success Response (200-201)
```json
{
  "success": true,
  "message": "Operation description",
  "data": {},
  "token": "jwt_token (if applicable)",
  "count": 0,
  "total": 0,
  "page": 1,
  "pages": 1
}
```

### Error Response (400-500)
```json
{
  "success": false,
  "message": "Error description"
}
```

## Status Codes

- `200`: OK - Request successful
- `201`: Created - Resource created successfully
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `500`: Internal Server Error - Server error

---

## 🔐 Authentication Endpoints (`/api/auth`)

### 1. Register User
Creates a new user account.

**Endpoint:** `POST /api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Yash Raj",
  "email": "212myashraj@gmail.com",
  "password": "test123",
  "role": "student"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | User's full name |
| email | string | Yes | Unique email address |
| password | string | Yes | Minimum 6 characters |
| role | string | No | "student" (default) or "admin" |

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "role": "student"
  }
}
```

**Examples:**
```bash
# Using curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "password": "test123"
  }'
```

---

### 2. Login User
Authenticates user and returns JWT token.

**Endpoint:** `POST /api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "212myashraj@gmail.com",
  "password": "test123"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email |
| password | string | Yes | User's password |

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "role": "student"
  }
}
```

---

## 📚 Course Endpoints (`/api/courses`)

### 1. Get All Courses
Retrieves all available courses with pagination.

**Endpoint:** `GET /api/courses`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "total": 10,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Web Development Basics",
      "description": "Learn HTML, CSS, and JavaScript",
      "price": 5000,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Yash Raj",
        "email": "212myashraj@gmail.com"
      },
      "createdAt": "2024-03-24T10:00:00.000Z",
      "updatedAt": "2024-03-24T10:00:00.000Z"
    }
  ]
}
```

**Examples:**
```bash
# Get first page
curl http://localhost:5000/api/courses

# Get with pagination
curl "http://localhost:5000/api/courses?page=2&limit=5"
```

---

### 2. Get Single Course
Retrieves details of a specific course.

**Endpoint:** `GET /api/courses/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Course ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Web Development Basics",
    "description": "Learn HTML, CSS, and JavaScript",
    "price": 5000,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Yash Raj",
      "email": "212myashraj@gmail.com"
    },
    "createdAt": "2024-03-24T10:00:00.000Z",
    "updatedAt": "2024-03-24T10:00:00.000Z"
  }
}
```

---

### 3. Create Course (Admin Only)
Creates a new course. Requires admin authentication.

**Endpoint:** `POST /api/courses`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Request Body:**
```json
{
  "title": "Python Programming",
  "description": "Learn Python from basics to advanced",
  "price": 4500
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Course title (max 100 chars) |
| description | string | Yes | Course description (max 1000 chars) |
| price | number | Yes | Course price (≥ 0) |

**Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Python Programming",
    "description": "Learn Python from basics to advanced",
    "price": 4500,
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2024-03-24T10:00:00.000Z",
    "updatedAt": "2024-03-24T10:00:00.000Z"
  }
}
```

---

### 4. Update Course (Admin Only)
Updates an existing course.

**Endpoint:** `PUT /api/courses/:id`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Course ID |

**Request Body:**
```json
{
  "title": "Advanced Python Programming",
  "description": "Advanced Python techniques and concepts",
  "price": 6000
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Advanced Python Programming",
    "description": "Advanced Python techniques and concepts",
    "price": 6000,
    "createdBy": "507f1f77bcf86cd799439012",
    "updatedAt": "2024-03-24T10:15:00.000Z"
  }
}
```

---

### 5. Delete Course (Admin Only)
Deletes a course.

**Endpoint:** `DELETE /api/courses/:id`

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Course ID |

**Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Python Programming",
    "price": 4500
  }
}
```

---

## 📧 Contact Endpoints (`/api/contact`)

### 1. Submit Contact Form
Submits a new contact form entry. No authentication required.

**Endpoint:** `POST /api/contact`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Yash Raj",
  "email": "212myashraj@gmail.com",
  "message": "I have a question about Python course"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Sender's name (max 50 chars) |
| email | string | Yes | Sender's email |
| message | string | Yes | Message content (max 2000 chars) |

**Response (201):**
```json
{
  "success": true,
  "message": "Your message has been received. We will contact you soon!",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "message": "I have a question about Python course",
    "status": "new",
    "createdAt": "2024-03-24T10:00:00.000Z"
  }
}
```

---

### 2. Get All Contact Submissions
Retrieves all contact submissions with pagination.

**Endpoint:** `GET /api/contact`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |

**Response (200):**
```json
{
  "success": true,
  "count": 1,
  "total": 5,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Yash Raj",
      "email": "212myashraj@gmail.com",
      "message": "I have a question",
      "status": "new",
      "createdAt": "2024-03-24T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Contact
Retrieves a specific contact submission.

**Endpoint:** `GET /api/contact/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Contact ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "message": "I have a question",
    "status": "new",
    "createdAt": "2024-03-24T10:00:00.000Z"
  }
}
```

---

### 4. Update Contact Status
Updates the status of a contact submission.

**Endpoint:** `PUT /api/contact/:id`

**Headers:**
```
Content-Type: application/json
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Contact ID |

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Status Values:** `new`, `read`, `resolved`

**Response (200):**
```json
{
  "success": true,
  "message": "Contact status updated",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "resolved",
    "updatedAt": "2024-03-24T10:30:00.000Z"
  }
}
```

---

### 5. Delete Contact
Deletes a contact submission.

**Endpoint:** `DELETE /api/contact/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Contact ID |

**Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

## 👨‍💼 Admin Endpoints (`/api/admin`)

All admin endpoints require JWT authentication with admin role.

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

### 1. Get Dashboard Statistics
Retrieves dashboard statistics for the admin panel.

**Endpoint:** `GET /api/admin/dashboard/stats`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 50,
    "totalStudents": 45,
    "totalAdmins": 5,
    "totalCourses": 10,
    "totalContacts": 100,
    "newContacts": 5
  }
}
```

---

### 2. Get All Users
Retrieves all users with pagination and optional role filtering.

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |
| role | string | - | Filter by role: "student" or "admin" |

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Yash Raj",
      "email": "212myashraj@gmail.com",
      "role": "student",
      "createdAt": "2024-03-24T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Single User
Retrieves details of a specific user.

**Endpoint:** `GET /api/admin/users/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | User ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "role": "student",
    "createdAt": "2024-03-24T10:00:00.000Z",
    "updatedAt": "2024-03-24T10:00:00.000Z"
  }
}
```

---

### 4. Update User Role
Changes a user's role.

**Endpoint:** `PUT /api/admin/users/:id/role`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | User ID |

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "role": "admin"
  }
}
```

---

### 5. Delete User
Deletes a user account.

**Endpoint:** `DELETE /api/admin/users/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | User ID |

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 6. Get All Contact Requests
Retrieves all contact requests with pagination and optional status filtering.

**Endpoint:** `GET /api/admin/contacts`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |
| status | string | - | Filter by status: "new", "read", "resolved" |

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 30,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Yash Raj",
      "email": "212myashraj@gmail.com",
      "message": "Question about courses",
      "status": "new",
      "createdAt": "2024-03-24T10:00:00.000Z"
    }
  ]
}
```

---

### 7. Get Single Contact Request
Retrieves a specific contact request and marks it as read.

**Endpoint:** `GET /api/admin/contacts/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Contact ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Yash Raj",
    "email": "212myashraj@gmail.com",
    "message": "Question about courses",
    "status": "read",
    "createdAt": "2024-03-24T10:00:00.000Z"
  }
}
```

---

### 8. Update Contact Status
Updates the status of a contact request.

**Endpoint:** `PUT /api/admin/contacts/:id/status`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Contact ID |

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Contact status updated",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "resolved"
  }
}
```

---

### 9. Delete Contact Request
Deletes a contact request.

**Endpoint:** `DELETE /api/admin/contacts/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | ObjectId | Yes | Contact ID |

**Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

## 🏥 Health Check

### Health Check Endpoint
Checks if the server is running.

**Endpoint:** `GET /api/health`

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## 🚨 Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are MongoDB ObjectIds
- Passwords are never returned in any response
- Tokens expire in 7 days
- Use pagination for better performance with large datasets
- All string fields are trimmed of whitespace

---

## 🔒 Security Best Practices

1. **Never share your JWT token** - It gives access to your account
2. **Use HTTPS in production** - Always encrypt data in transit
3. **Change JWT_SECRET** - Use a strong, unique secret key
4. **Validate input** - All inputs are validated on the server
5. **Keep dependencies updated** - Regularly update packages
6. **Use environment variables** - Never hardcode sensitive data
