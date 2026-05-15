require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const EMAIL    = 'admin@ghs.gov.gh';
const PASSWORD = 'admin123';
const NAME     = 'GHS Admin';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email: EMAIL });
  if (user) {
    user.role = 'admin';
    await user.save();
    console.log(`Promoted existing user "${EMAIL}" to admin.`);
  } else {
    await User.create({ name: NAME, email: EMAIL, password: PASSWORD, role: 'admin' });
    console.log(`Created admin account: ${EMAIL} / ${PASSWORD}`);
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
