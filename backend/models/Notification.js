const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:      { type: String, enum: ['message', 'report_reviewed', 'report_submitted', 'feedback', 'invite'], default: 'message' },
    message:   { type: String, required: true },
    link:      { type: String, default: '' },
    read:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
