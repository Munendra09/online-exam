const nodemailer = require('nodemailer');

const store = new Map();

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 1);

function createTransporter() {
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

async function generateAndSend(arg1, arg2, arg3) {
  let key, email, purpose;
  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
    key = arg1.key;
    email = arg1.email;
    purpose = arg1.purpose || 'Verification';
  } else {
    if (arg3 !== undefined) {
      key = arg1;
      email = arg2;
      purpose = arg3;
    } else {
      email = arg1;
      key = arg1;
      purpose = arg2 || 'Verification';
    }
  }

  if (!key) throw new Error('OTP key is required');
  if (!email) throw new Error('Email is required');

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  store.set(key, { otp, expiresAt });

  const mode = process.env.OTP_MODE === 'server' ? 'server' : 'client';

  if (mode === 'server') {
    console.log('Sending OTP by server SMTP...');
    console.log('SMTP HOST:', process.env.SMTP_HOST);
    console.log('SMTP PORT:', process.env.SMTP_PORT);
    console.log('SMTP USER:', process.env.SMTP_USER);

    const transporter = createTransporter();

    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Lucky Tech Academy'}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: email,
        subject: `${purpose} OTP - Lucky Tech Academy`,
        text: `Your OTP for ${purpose} is: ${otp}\nValid for ${OTP_EXPIRY_MINUTES} minute(s).`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2>Lucky Tech Academy</h2>
            <p>Your OTP for <b>${purpose}</b> is:</p>
            <h1 style="letter-spacing:6px;font-size:32px;margin:20px 0;color:#2563eb;">${otp}</h1>
            <p>Valid for <b>${OTP_EXPIRY_MINUTES} minute(s)</b>.</p>
            <br/>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
            <p style="font-size:12px;color:#6b7280;">
              This email was sent from the Lucky Tech Academy portal: 
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color:#2563eb;">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a>
            </p>
          </div>
        `,
      });
      console.log('OTP email sent successfully');
    } catch (mailError) {
      console.error('SMTP sendMail error in otpService:', mailError);
      const err = new Error('Failed to send OTP email. Please check your SMTP configuration or network connection.');
      err.status = 400;
      throw err;
    }

    return {
      otp: null,
      expiresAt: expiresAt.toISOString(),
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      mode,
      sent: true,
    };
  }

  return {
    otp,
    expiresAt: expiresAt.toISOString(),
    expiresIn: OTP_EXPIRY_MINUTES * 60,
    mode,
    sent: false,
  };
}

function verifyOtp(key, otp) {
  const entry = store.get(key);

  if (!entry) {
    return { ok: false, valid: false, reason: 'not_found' };
  }

  if (new Date() > new Date(entry.expiresAt)) {
    store.delete(key);
    return { ok: false, valid: false, reason: 'expired' };
  }

  if (entry.otp !== String(otp).trim()) {
    return { ok: false, valid: false, reason: 'invalid' };
  }

  store.delete(key);
  return { ok: true, valid: true };
}

function clearOtp(key) {
  store.delete(key);
}

module.exports = {
  generateAndSend,
  generateAndSendOtp: generateAndSend,
  verifyOtp,
  clearOtp,
};