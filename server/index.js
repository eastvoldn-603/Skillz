const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/jobs', require('./routes/jobs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Initialize database connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  
  // Start server (only if not in test environment or if server not already running)
  if (!module.parent || process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: SQLite (${process.env.DB_PATH || 'skillz.db'})`);
    });
  }
});

module.exports = app;

