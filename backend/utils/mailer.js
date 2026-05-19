const https = require('https');

const send = (payload) => new Promise((resolve, reject) => {
  const body = JSON.stringify(payload);
  const req  = https.request(
    {
      hostname: 'api.resend.com',
      path:     '/emails',
      method:   'POST',
      headers:  {
        Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API ${res.statusCode}: ${data}`));
        }
      });
    }
  );
  req.on('error', reject);
  req.write(body);
  req.end();
});

const FROM = `LogBook <${process.env.FROM_EMAIL}>`;

exports.sendPasswordReset = (to, resetUrl) => send({
  from:    FROM,
  to:      [to],
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

exports.sendInvite = (to, inviteUrl) => send({
  from:    FROM,
  to:      [to],
  subject: `You've been invited to the LogBook Admin Portal`,
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#2563EB;margin-top:0">You're Invited</h2>
      <p style="color:#374151">You have been invited to access the LogBook admin portal as a <strong>Reviewer</strong>.</p>
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
