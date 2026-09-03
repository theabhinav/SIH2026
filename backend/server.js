const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { connectDB } = require('./config/db');

// Import modular routes
const authRoutes = require('./routes/authRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');
const shopRoutes = require('./routes/shopRoutes');
const metaRoutes = require('./routes/metaRoutes');

const app = express();
const PORT = process.env.PORT || 8001;

// Global Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '8mb' }));

// Health Check API
app.get('/api', (req, res) => {
  res.json({ message: 'Grameen Udyog AI Advisory API (Node.js/Express)', status: 'live' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', advisoryRoutes);
app.use('/api', shopRoutes);
app.use('/api', metaRoutes);

// Serve Frontend static files if built
const frontendBuildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ detail: 'API route not found' });
  }
  const indexPath = path.join(frontendBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({ message: 'Grameen Udyog AI Advisory API', status: 'live' });
});

// Initialize DB and start server
connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Express server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
