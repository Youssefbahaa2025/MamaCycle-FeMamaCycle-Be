# MamaCycle Backend API

This is the backend API server for the MamaCycle application, built with Node.js, Express, and MySQL.

## Features

- RESTful API for user authentication, products, orders, community posts, and more
- JWT authentication
- Cloudinary integration for image storage
- MySQL database

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- Cloudinary account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mamacycle

# Server Configuration
PORT=3000
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dk0szadna
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your database
4. Run the server:
   ```
   npm start
   ```

## Deployment to Railway

1. Create a new project in Railway
2. Link your GitHub repository
3. Set up the environment variables as listed above
4. Deploy the application

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product (requires authentication)

### Community
- `GET /api/community` - Get all community posts
- `POST /api/community` - Create a new post (requires authentication)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile (requires authentication)

## License

This project is licensed under the MIT License 