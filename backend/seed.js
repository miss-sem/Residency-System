require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectDB = require('./config/db');
const User = require('./models/User');

const ADMIN = {
  name:     'GHS Admin',
  email:    'admin@ghs.gov.gh',
  password: 'Admin@1234',
  role:     'admin',
};

(async () => {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    await User.deleteOne({ email: ADMIN.email });
  }

  // Let the pre-save hook handle hashing — do NOT pre-hash here
  await User.create(ADMIN);

  console.log('✓ Admin created');
  console.log('  Email   :', ADMIN.email);
  console.log('  Password:', ADMIN.password);

  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
