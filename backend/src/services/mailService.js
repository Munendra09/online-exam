const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST is missing');
  }

  if (!process.env.SMTP_USER) {
    throw new Error('SMTP_USER is missing');
  }

  if (!process.env.SMTP_PASS) {
    throw new Error('SMTP_PASS is missing');
  }

  if (!process.env.SMTP_FROM_EMAIL) {
    throw new Error('SMTP_FROM_EMAIL is missing');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
  });
}

async function sendMail({ to, subject, html }) {
  if (!to) throw new Error('Email receiver is required');
  if (!subject) throw new Error('Email subject is required');
  if (!html) throw new Error('Email html is required');

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Lucky Tech Academy'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (mailError) {
    console.error('SMTP sendMail error in mailService:', mailError);
    const err = new Error('Failed to send notification email. Please check your SMTP configuration or network connection.');
    err.status = 400;
    throw err;
  }
}

async function sendReleaseMail({ to, name, examTitle, type, link }) {
  const titles = {
    admit: 'Admit Card Released',
    answerKey: 'Answer Key Released',
    result: 'Result Released',
  };

  const messages = {
    admit: `Your admit card for ${examTitle} has been released.`,
    answerKey: `Answer key for ${examTitle} has been released.`,
    result: `Your result for ${examTitle} has been released.`,
  };

  if (!titles[type]) {
    throw new Error('Invalid release mail type');
  }

  const subject = `${titles[type]} - Lucky Tech Academy`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Hello ${name || 'Student'},</h2>
      <p>${messages[type]}</p>

      <p>
        <a href="${link}"
          style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;
          text-decoration:none;border-radius:8px;font-weight:bold;">
          Open ${titles[type]}
        </a>
      </p>

      <p>If the button does not work, copy and open this link:</p>
      <p style="word-break:break-all;color:#2563eb">${link}</p>

      <br/>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
      <p>Regards,<br/><b>Lucky Tech Academy</b></p>
      <p style="font-size:12px;color:#6b7280;">
        Visit our portal: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color:#2563eb;">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a>
      </p>
    </div>
  `;

  return sendMail({ to, subject, html });
}

async function sendWelcome(user) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const subject = 'Welcome to Lucky Tech Academy';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Welcome, ${user.name || 'Student'}!</h2>
      <p>Thank you for registering at <b>Lucky Tech Academy</b>.</p>
      <p>Your account has been created successfully. You can log in using the details below:</p>
      <table style="border-collapse:collapse;width:100%;max-width:400px;margin:20px 0;">
        <tr>
          <td style="padding:8px 0;font-weight:bold;color:#4b5563;">Registration ID:</td>
          <td style="padding:8px 0;color:#111827;">${user.registrationId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:bold;color:#4b5563;">Email:</td>
          <td style="padding:8px 0;color:#111827;">${user.email}</td>
        </tr>
      </table>
      <p>
        <a href="${frontendUrl}/login"
          style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;
          text-decoration:none;border-radius:8px;font-weight:bold;">
          Log In to Portal
        </a>
      </p>
      <p>If the button does not work, copy and open this link:</p>
      <p style="word-break:break-all;color:#2563eb">${frontendUrl}/login</p>
      <br/>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
      <p>Regards,<br/><b>Lucky Tech Academy</b></p>
      <p style="font-size:12px;color:#6b7280;">
        Visit our portal: <a href="${frontendUrl}" style="color:#2563eb;">${frontendUrl}</a>
      </p>
    </div>
  `;
  return sendMail({ to: user.email, subject, html });
}

module.exports = {
  sendMail,
  sendReleaseMail,
  sendWelcome,
};