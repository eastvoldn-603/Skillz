# Quick Start Guide

Get the Skillz application up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js v18+ installed (`node --version`)
- [ ] MySQL 8.0+ installed and running
- [ ] npm installed (`npm --version`)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 2. Create Database

```sql
CREATE DATABASE skillz_db;
```

### 3. Create .env File

Create `.env` in the root directory:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=skillz_db
JWT_SECRET=change-this-to-a-random-secret-key
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Seed Sample Jobs (Optional)

```bash
npm run seed:jobs
```

### 5. Start Application

```bash
npm run dev
```

### 6. Open Browser

Navigate to: **http://localhost:3000**

## First Steps

1. **Sign Up**: Create a new account
2. **Create Resume**: Go to Resumes → Create New Resume
3. **Browse Jobs**: Go to Jobs to see available positions
4. **Apply**: Click on a job and apply with your resume

## Common Commands

```bash
# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Run tests
npm test

# Seed sample jobs
npm run seed:jobs
```

## Troubleshooting

**Can't connect to database?**
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database exists

**Port already in use?**
- Change `PORT` in `.env` to another port (e.g., 5001)
- Update `REACT_APP_API_URL` accordingly

**Module not found?**
```bash
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

## Need More Help?

- See [SETUP.md](SETUP.md) for detailed setup
- See [README.md](README.md) for full documentation
- Check GitHub issues for common problems

Happy coding! 🎉

