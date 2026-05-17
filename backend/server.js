require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { registerSocketHandlers } = require('./socket');

const authRoutes    = require('./routes/auth');
const adminRoutes   = require('./routes/admin');
const reportRoutes  = require('./routes/reports');
const messageRoutes = require('./routes/messages');
const notifRoutes   = require('./routes/notifications');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Make io available to route handlers
app.set('io', io);

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',          authRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/notifications', notifRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
