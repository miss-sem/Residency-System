const Notification = require('./models/Notification');

const onlineUsers = new Map(); // userId -> socketId

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // ── Auth / presence ─────────────────────────────────────────
    socket.on('user_connected', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // ── Join a private room (userId) ─────────────────────────────
    socket.on('join_room', (userId) => {
      socket.join(userId);
    });

    // ── Messaging ────────────────────────────────────────────────
    socket.on('send_message', (msg) => {
      // msg: { _id, sender, receiver, content, createdAt, report }
      io.to(msg.receiver).emit('new_message', msg);
      io.to(msg.sender).emit('new_message', msg); // echo to sender's other tabs
    });

    socket.on('typing', ({ to, from, name }) => {
      io.to(to).emit('typing', { from, name });
    });

    socket.on('stop_typing', ({ to, from }) => {
      io.to(to).emit('stop_typing', { from });
    });

    socket.on('message_read', ({ messageId, to }) => {
      io.to(to).emit('message_read', { messageId });
    });

    // ── Notifications ─────────────────────────────────────────────
    socket.on('notify', async ({ recipientId, type, message, link }) => {
      try {
        const notif = await Notification.create({ recipient: recipientId, type, message, link });
        io.to(recipientId).emit('notification', notif);
      } catch (_) {}
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('online_users', Array.from(onlineUsers.keys()));
      }
    });
  });
};

module.exports = { registerSocketHandlers, onlineUsers };
