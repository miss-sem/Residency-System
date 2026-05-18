const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   'smtp.resend.com',
  port:   465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});

const FROM = `"LogBook" <${process.env.FROM_EMAIL}>`;

exports.sendPasswordReset = async (to, resetUrl) => {
  await transporter.sendMail({
    from:    FROM,
    to,
    subject: 'Reset your LogBook password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#2563EB;margin-top:0">Password Reset</h2>
        <p style="color:#374151">You requested a password reset for your LogBook account.</p>
        <p style="color:#374151">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;
                  text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          If you didn't request this, ignore this email. Your password will not change.
        </p>
      </div>
    `,
  });
};

exports.sendInvite = async (to, inviteUrl, inviterName) => {
  await transporter.sendMail({
    from:    FROM,
    to,
    subject: `You've been invited to the LogBook Admin Portal`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#2563EB;margin-top:0">You're Invited</h2>
        <p style="color:#374151"><strong>${inviterName}</strong> has invited you to access the LogBook admin portal as a <strong>Reviewer</strong>.</p>
        <p style="color:#374151">Click the button below to access the portal and start reviewing student reports. This link expires in <strong>48 hours</strong>.</p>
        <a href="${inviteUrl}"
           style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;
                  text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0">
          Access Admin Portal
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          If you weren't expecting this invite, you can safely ignore it.
        </p>
      </div>
    `,
  });
};
