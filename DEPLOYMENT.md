# FantaAiuto - Deployment Guide

## Architecture Overview

FantaAiuto is now a full-stack application with:
- **Frontend**: Vanilla JavaScript SPA (localhost:8084)
- **Backend**: Node.js/Express API (localhost:3001)
- **Database**: SQLite with multi-user schema
- **Authentication**: JWT tokens with bcrypt password hashing

## Local Development Setup

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies (if using build tools)
cd ..
npm install
```

### 2. Environment Configuration

Backend environment is configured in `backend/.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database/fantaaiuto.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_TIMEOUT=7d
FRONTEND_URL=http://localhost:8084
```

### 3. Database Setup

Database is automatically initialized when backend starts:
```bash
cd backend
npm start
```

Default admin user is created: `admin/password`

### 4. Start Services

**Backend API** (Terminal 1):
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Frontend** (Terminal 2):
```bash
npm run dev
# Starts webpack dev server on localhost:8084
```

### 5. Access Application

- Frontend: http://localhost:8084
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Testing

### Backend API Tests
```bash
cd backend
node test-backend.js
```

### Frontend Tests
```bash
npm test
```

## Default Credentials

- Username: `admin`
- Password: `password`

## Production Deployment

### 1. Environment Variables
Update `backend/.env` for production:
```env
NODE_ENV=production
JWT_SECRET=your-strong-random-jwt-secret
DATABASE_PATH=/path/to/production/database.db
FRONTEND_URL=https://your-domain.com
```

### 2. Database Migration
```bash
cd backend
npm run migrate
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Start Production Services
```bash
cd backend
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/verify` - Verify token

### Players
- GET `/api/players` - Get user's players
- POST `/api/players/import` - Import players from Excel
- PATCH `/api/players/:id/status` - Update player status
- GET `/api/players/stats` - Get user statistics

### Participants
- GET `/api/participants` - Get user's participants
- POST `/api/participants` - Create participant
- PUT `/api/participants/:id` - Update participant
- DELETE `/api/participants/:id` - Delete participant

### Formations
- GET `/api/formations` - Get user's formations
- POST `/api/formations` - Create formation
- PUT `/api/formations/:id` - Update formation
- DELETE `/api/formations/:id` - Delete formation

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Rate limiting
- Helmet.js security headers
- User data isolation
- Input validation

## Database Schema

Multi-user schema with proper isolation:
- `users` - User accounts and authentication
- `master_players` - Global player database
- `user_players` - User-specific player data
- `participants` - User's league participants
- `formations` - User's tactical formations
- `user_sessions` - Active user sessions