const authRoutes = require('./routes/auth.routes');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { setupSwagger } = require('./config/swagger');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRoutes);

// health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// SWAGGER DOCS
setupSwagger(app);

// 404 Handler
app.use('/*splat', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('Global Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
