# Setup Guide

This guide will help you set up the Skillz application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MySQL** (8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **npm** (comes with Node.js) or **yarn**

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Skillz
```

## Step 2: Install Dependencies

### Install Root Dependencies

```bash
npm install
```

### Install Client Dependencies

```bash
cd client
npm install
cd ..
```

## Step 3: Set Up MySQL Database

### Create Database

1. Start your MySQL server
2. Open MySQL command line or a MySQL client
3. Create the database:

```sql
CREATE DATABASE skillz_db;
```

### Note

The database schema will be automatically created when you start the server for the first time.

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# On Windows (PowerShell)
New-Item .env

# On Linux/Mac
touch .env
```

Add the following content to `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=skillz_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-min-32-characters

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

**Important**: Replace `your_mysql_password` with your actual MySQL root password.

## Step 5: Seed Sample Data (Optional)

To populate the database with sample jobs:

```bash
npm run seed:jobs
```

## Step 6: Start the Application

### Option 1: Run Both Frontend and Backend Together

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

## Step 7: Access the Application

1. Open your browser
2. Navigate to http://localhost:3000
3. Create an account or login

## Troubleshooting

### Database Connection Error

**Problem**: Cannot connect to MySQL database

**Solutions**:
- Verify MySQL server is running
- Check database credentials in `.env`
- Ensure database `skillz_db` exists
- Check MySQL port (default: 3306)

### Port Already in Use

**Problem**: Port 5000 or 3000 is already in use

**Solutions**:
- Change `PORT` in `.env` to a different port (e.g., 5001)
- Kill the process using the port:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
  - Linux/Mac: `lsof -ti:5000 | xargs kill`

### Module Not Found Errors

**Problem**: `Cannot find module` errors

**Solutions**:
- Delete `node_modules` folders
- Delete `package-lock.json` files
- Run `npm install` again in root and client directories

### Frontend Not Connecting to Backend

**Problem**: API calls fail with CORS or connection errors

**Solutions**:
- Verify `REACT_APP_API_URL` in `.env` matches backend URL
- Ensure backend server is running
- Check CORS settings in `server/index.js`

## Next Steps

- Read the [README.md](README.md) for more information
- Check [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **Database Changes**: The schema auto-creates on first run. For changes, modify `server/config/database.js`
3. **Testing**: Run `npm test` to execute test suite
4. **Linting**: Consider adding ESLint for code quality

## Getting Help

If you encounter issues:
1. Check this guide
2. Review error messages carefully
3. Check GitHub issues
4. Create a new issue with details

Happy coding! 🚀

