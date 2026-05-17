const WeeklyReport = require('../models/WeeklyReport');
const User         = require('../models/User');
const Notification = require('../models/Notification');

// ─── Resident ────────────────────────────────────────────────────────────────

exports.createReport = async (req, res) => {
  try {
    const { unit, weekStartDate, days, additionalNotes } = req.body;

    const existing = await WeeklyReport.findOne({
      resident: req.user._id,
      unit,
      weekStartDate: new Date(weekStartDate),
    });

    if (existing) {
      return res.status(409).json({ message: 'A report for this unit and week already exists' });
    }

    const report = await WeeklyReport.create({
      resident: req.user._id,
      unit,
      weekStartDate,
      days: days || {},
      additionalNotes: additionalNotes || '',
      status: 'draft',
    });

    res.status(201).json({ message: 'Report created', report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findOne({
      _id: req.params.id,
      resident: req.user._id,
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status === 'submitted' || report.status === 'reviewed') {
      return res.status(400).json({ message: 'Cannot edit a submitted or reviewed report' });
    }

    const { unit, weekStartDate, days, additionalNotes } = req.body;

    if (unit) report.unit = unit;
    if (weekStartDate) report.weekStartDate = weekStartDate;
    if (days) report.days = { ...report.days.toObject(), ...days };
    if (additionalNotes !== undefined) report.additionalNotes = additionalNotes;

    await report.save();
    res.json({ message: 'Report updated', report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findOne({
      _id: req.params.id,
      resident: req.user._id,
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft reports can be submitted' });
    }

    report.status = 'submitted';
    report.submittedAt = new Date();
    await report.save();

    // Notify all admins and reviewers
    const admins = await User.find({ role: { $in: ['admin', 'reviewer'] } }).select('_id');
    const io = req.app.get('io');
    await Promise.all(admins.map(async (admin) => {
      const notif = await Notification.create({
        recipient: admin._id,
        type:      'report_submitted',
        message:   `${req.user.name} submitted a report for ${report.unit}`,
        link:      `/admin/reports/${report._id}`,
      });
      if (io) io.to(admin._id.toString()).emit('notification', notif);
    }));

    res.json({ message: 'Report submitted successfully', report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const { status, unit, weekFrom, weekTo } = req.query;
    const query = { resident: req.user._id };

    if (status) query.status = status;
    if (unit) query.unit = unit;
    if (weekFrom || weekTo) {
      query.weekStartDate = {};
      if (weekFrom) query.weekStartDate.$gte = new Date(weekFrom);
      if (weekTo)   query.weekStartDate.$lte = new Date(weekTo);
    }

    const reports = await WeeklyReport.find(query).sort({ weekStartDate: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findOne({
      _id: req.params.id,
      resident: req.user._id,
    });

    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (report.status === 'reviewed' && !report.feedbackRead) {
      report.feedbackRead = true;
      await report.save();
    }

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyDashboard = async (req, res) => {
  try {
    const UNITS = WeeklyReport.UNITS || [
      'EPI', 'Orientation', 'Health Promotion',
      'Nutrition', 'Port Health', 'Non-Communicable Health',
    ];

    const [submitted, reviewed, drafts, unreadFeedback, recentFeedback, allActive, recentReports, unitAgg] =
      await Promise.all([
        WeeklyReport.countDocuments({ resident: req.user._id, status: 'submitted' }),
        WeeklyReport.countDocuments({ resident: req.user._id, status: 'reviewed' }),
        WeeklyReport.countDocuments({ resident: req.user._id, status: 'draft' }),
        WeeklyReport.countDocuments({ resident: req.user._id, status: 'reviewed', feedbackRead: false }),
        WeeklyReport.find({ resident: req.user._id, status: 'reviewed', adminFeedback: { $ne: '' } })
          .sort({ reviewedAt: -1 }).limit(5)
          .select('unit weekStartDate adminFeedback feedbackRead reviewedAt'),
        // All submitted/reviewed weeks for streak calculation
        WeeklyReport.find({ resident: req.user._id, status: { $in: ['submitted', 'reviewed'] } })
          .sort({ weekStartDate: -1 }).select('weekStartDate'),
        // Last 6 reports any status for activity feed
        WeeklyReport.find({ resident: req.user._id })
          .sort({ updatedAt: -1 }).limit(6)
          .select('unit weekStartDate status submittedAt reviewedAt updatedAt'),
        // Unit-level aggregation
        WeeklyReport.aggregate([
          { $match: { resident: req.user._id, status: { $in: ['submitted', 'reviewed'] } } },
          { $group: { _id: '$unit', count: { $sum: 1 } } },
        ]),
      ]);

    // ── Streak: consecutive weeks ending at the current or last Monday ──
    const snapMonday = (d) => {
      const dt = new Date(d); dt.setHours(0, 0, 0, 0);
      const dow = dt.getDay();
      dt.setDate(dt.getDate() + (dow === 0 ? -6 : 1 - dow));
      return dt.getTime();
    };
    const reportWeeks = new Set(allActive.map(r => snapMonday(r.weekStartDate)));
    let streak = 0;
    let cursor = snapMonday(new Date());
    while (reportWeeks.has(cursor)) { streak++; cursor -= 7 * 24 * 60 * 60 * 1000; }

    // ── Units coverage ──
    const unitsCoverage = UNITS.map(unit => ({
      unit,
      count: unitAgg.find(u => u._id === unit)?.count || 0,
    }));

    res.json({
      submitted, reviewed, drafts, unreadFeedback,
      total: submitted + reviewed + drafts,
      streak,
      unitsCoverage,
      recentFeedback,
      recentReports,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findOneAndDelete({
      _id: req.params.id,
      resident: req.user._id,
      status: 'draft',
    });

    if (!report) {
      return res.status(404).json({ message: 'Draft report not found' });
    }

    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

exports.getAllReports = async (req, res) => {
  try {
    const { status, unit, resident, week, weekFrom, weekTo, department, search } = req.query;
    const query = {};

    // Admins never see draft reports — those belong to the resident only
    query.status = status && status !== 'all' ? status : { $ne: 'draft' };
    if (unit) query.unit = unit;

    if (week) {
      query.weekStartDate = new Date(week);
    } else if (weekFrom || weekTo) {
      query.weekStartDate = {};
      if (weekFrom) query.weekStartDate.$gte = new Date(weekFrom);
      if (weekTo)   query.weekStartDate.$lte = new Date(weekTo);
    }

    if (department || search) {
      const userQuery = { role: 'resident' };
      if (department) userQuery.department = department;
      if (search) {
        userQuery.$or = [
          { name:       { $regex: search, $options: 'i' } },
          { email:      { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
        ];
      }
      const users = await User.find(userQuery).select('_id');
      query.resident = { $in: users.map(u => u._id) };
    } else if (resident) {
      query.resident = resident;
    }

    const reports = await WeeklyReport.find(query)
      .populate('resident', 'name email department')
      .sort({ submittedAt: -1, createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await WeeklyReport.findById(req.params.id).populate(
      'resident',
      'name email department'
    );

    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.reviewReport = async (req, res) => {
  try {
    const { adminFeedback } = req.body;
    const report = await WeeklyReport.findById(req.params.id);

    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted reports can be reviewed' });
    }

    report.status = 'reviewed';
    report.adminFeedback = adminFeedback || '';
    report.feedbackRead = false;
    report.reviewedAt = new Date();
    report.reviewedBy = req.user._id;

    await report.save();

    // Notify the resident
    const io = req.app.get('io');
    const notif = await Notification.create({
      recipient: report.resident,
      type:      'report_reviewed',
      message:   adminFeedback
        ? `Your ${report.unit} report was reviewed — feedback added`
        : `Your ${report.unit} report has been reviewed`,
      link:      `/resident/reports/${report._id}`,
    });
    if (io) io.to(report.resident.toString()).emit('notification', notif);

    res.json({ message: 'Report reviewed', report });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
