const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, required: true, trim: true },
    read:     { type: Boolean, default: false },
    report:   { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyReport', default: null },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model('Message', messageSchema);
