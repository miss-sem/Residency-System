const express  = require('express');
const router   = express.Router();
const Message  = require('../models/Message');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/messages/conversations — list of people I've messaged or been messaged by
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const msgs = await Message.find({
      $and: [
        { $or: [{ sender: userId }, { receiver: userId }] },
        { $or: [{ report: null }, { report: { $exists: false } }] },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('sender',   'name email role')
      .populate('receiver', 'name email role');

    // Group by the other party
    const map = new Map();
    for (const m of msgs) {
      const other = m.sender._id.toString() === userId.toString() ? m.receiver : m.sender;
      const key   = other._id.toString();
      if (!map.has(key)) {
        map.set(key, {
          user:       other,
          lastMessage: m,
          unread:     0,
        });
      }
      if (!m.read && m.receiver._id.toString() === userId.toString()) {
        map.get(key).unread++;
      }
    }

    res.json({ conversations: Array.from(map.values()) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/unread/count
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/contacts — chat contacts based on caller role
// admin → all reviewers; reviewer → admin; resident → admin
router.get('/contacts', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    let query;
    if (req.user.role === 'admin') {
      query = { role: 'reviewer' };
    } else {
      query = { role: 'admin' };
    }
    const contacts = await User.find(query).select('_id name email role');
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/admin-contact — returns the admin user for residents to initiate contact
router.get('/admin-contact', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const admin = await User.findOne({ role: 'admin' }).select('_id name email role');
    if (!admin) return res.status(404).json({ message: 'No admin found' });
    res.json({ user: admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/report/:reportId — all reviewer comments on a specific report
router.get('/report/:reportId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ report: req.params.reportId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/:userId — full conversation with one user
router.get('/:userId', protect, async (req, res) => {
  try {
    const me    = req.user._id;
    const other = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: me,    receiver: other },
        { sender: other, receiver: me    },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender',   'name email role')
      .populate('receiver', 'name email role');

    // Mark received messages as read
    await Message.updateMany({ sender: other, receiver: me, read: false }, { read: true });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages — send a message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content, reportId } = req.body;
    const message = await Message.create({
      sender:   req.user._id,
      receiver: receiverId,
      content,
      report:   reportId || null,
    });

    await message.populate('sender',   'name email role');
    await message.populate('receiver', 'name email role');

    // Real-time delivery via socket
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('new_message', message);
      io.to(req.user._id.toString()).emit('new_message', message);
    }

    // Persist notification — reviewer comments link directly to the report
    const notifLink = reportId && req.user.role === 'reviewer'
      ? `/admin/reports/${reportId}`
      : req.user.role === 'resident'
        ? `/admin/messages`
        : `/resident/messages`;

    const notif = await Notification.create({
      recipient: receiverId,
      type:      'message',
      message:   reportId && req.user.role === 'reviewer'
        ? `${req.user.name} left a comment on a report`
        : `New message from ${req.user.name}`,
      link: notifLink,
    });
    if (io) io.to(receiverId).emit('notification', notif);

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
