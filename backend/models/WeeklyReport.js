const mongoose = require('mongoose');

const UNITS = [
  'EPI',
  'Orientation',
  'Health Promotion',
  'Nutrition',
  'Port Health',
  'Non-Communicable Health',
];

const dayEntrySchema = new mongoose.Schema(
  {
    activities: { type: String, default: '' },
    competenciesAcquired: { type: String, default: '' },
  },
  { _id: false }
);

const weeklyReportSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    unit: {
      type: String,
      enum: UNITS,
      required: [true, 'Unit is required'],
    },
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
    },
    days: {
      monday: { type: dayEntrySchema, default: () => ({}) },
      tuesday: { type: dayEntrySchema, default: () => ({}) },
      wednesday: { type: dayEntrySchema, default: () => ({}) },
      thursday: { type: dayEntrySchema, default: () => ({}) },
      friday: { type: dayEntrySchema, default: () => ({}) },
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed'],
      default: 'draft',
    },
    adminFeedback: {
      type: String,
      default: '',
    },
    feedbackRead: {
      type: Boolean,
      default: false,
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

weeklyReportSchema.statics.UNITS = UNITS;

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
