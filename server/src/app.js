require('dotenv').config();

const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const { errorHandler } = require('./middleware/errorHandler');

// ── Routes ───────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const assetRoutes     = require('./routes/assets');
const userRoutes      = require('./routes/users');
const categoryRoutes  = require('./routes/categories');
const locationRoutes  = require('./routes/locations');

// ── App & Server ─────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Socket.IO ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Make io accessible in services via app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  const { role, userId } = socket.handshake.auth || {};
  if (role === 'admin' || role === 'inventory manager') {
    socket.join('admins');
  }
  if (userId) {
    socket.join(`user:${userId}`);
  }
  console.log(`[ws] ${role || 'unknown'} connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[ws] disconnected: ${socket.id}`);
  });
});

// ── Security middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use('/api/',           globalLimiter);
app.use('/api/auth/login', authLimiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Request logging ───────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Static files (uploaded assets/photos) ────────────────────
// Served at /uploads/* — Nginx will handle this in production
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/assets',    assetRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations',  locationRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:      'ok',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ── 404 for unknown API routes ────────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`\n🚀 ITS API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health      : http://localhost:${PORT}/api/health\n`);
});

module.exports = { app, server };
