const User = require('../models/User');
const WeeklyReport = require('../models/WeeklyReport');

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

exports.createResident = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const resident = await User.create({ name, email, password, role: 'resident' });
    res.status(201).json({ message: 'Resident created', user: formatUser(resident) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllResidents = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'resident' };

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const residents = await User.find(query).sort({ createdAt: -1 });
    res.json({ residents: residents.map(formatUser) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateResident = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const resident = await User.findOne({ _id: req.params.id, role: 'resident' });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    if (name)     resident.name     = name;
    if (email)    resident.email    = email;
    if (password) resident.password = password;

    await resident.save();
    res.json({ message: 'Resident updated', user: formatUser(resident) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteResident = async (req, res) => {
  try {
    const resident = await User.findOneAndDelete({ _id: req.params.id, role: 'resident' });

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    await WeeklyReport.deleteMany({ resident: req.params.id });
    res.json({ message: 'Resident deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Current week's Monday at midnight
    const now = new Date();
    const dow = now.getDay();
    const currentMon = new Date(now);
    currentMon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    currentMon.setHours(0, 0, 0, 0);

    // Basic counts (admins never see drafts in totals)
    const [totalResidents, totalReports, submitted, reviewed] = await Promise.all([
      User.countDocuments({ role: 'resident' }),
      WeeklyReport.countDocuments({ status: { $ne: 'draft' } }),
      WeeklyReport.countDocuments({ status: 'submitted' }),
      WeeklyReport.countDocuments({ status: 'reviewed' }),
    ]);

    // Weekly submission trend — last 6 weeks in parallel
    const weeklyTrend = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const mon = new Date(currentMon);
        mon.setDate(mon.getDate() - (5 - i) * 7);
        const sun = new Date(mon);
        sun.setDate(sun.getDate() + 6);
        sun.setHours(23, 59, 59, 999);
        return WeeklyReport.countDocuments({
          status: { $ne: 'draft' },
          submittedAt: { $gte: mon, $lte: sun },
        }).then(count => ({ week: mon.toISOString().split('T')[0], count }));
      })
    );

    res.json({
      totalResidents,
      totalReports,
      submitted,
      reviewed,
      pendingReview: submitted,
      weeklyTrend,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
