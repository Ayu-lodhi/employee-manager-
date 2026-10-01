const nodemailer = require('nodemailer');

// ====================================================================
// Email Service — Nodemailer with two modes:
//   1. TEST: Uses Ethereal (fake SMTP that captures emails)
//   2. PROD: Uses real SMTP (Gmail/SendGrid)
// ====================================================================

let transporter = null;
let testAccount = null;

// Initialize transporter
const initTransporter = async () => {
  if (transporter) return transporter;

  // Check if real SMTP credentials are provided
  const hasRealCreds = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (hasRealCreds) {
    console.log('EMAIL_INIT :: Using real SMTP:', process.env.EMAIL_HOST);
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Use Ethereal for testing
    console.log('EMAIL_INIT :: No SMTP creds - using Ethereal test account');
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('EMAIL_INIT :: Ethereal user:', testAccount.user);
  }

  return transporter;
};

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const t = await initTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || '"TBI Platform" <noreply@tbi.org>',
      to,
      subject,
      html: html || text,
      text: text || '',
    });

    console.log(`EMAIL_SENT :: to=${to} :: subject="${subject}"`);

    // If using Ethereal, print preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`EMAIL_PREVIEW :: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error('EMAIL_FAILED ::', err.message);
    return { success: false, error: err.message };
  }
};

// ====================================================================
// WELCOME EMAIL TEMPLATE — Sent when Admin creates a user
// ====================================================================
const sendWelcomeEmail = async ({ to, name, role, tempPassword, loginUrl }) => {
  const tierLabel = {
    T1_VOLUNTEER: 'T1 Volunteer',
    T2_ASSOCIATE: 'T2 Associate',
    T3_EXECUTIVE: 'T3 Executive',
    ADMIN: 'Administrator',
    SUPER_ADMIN: 'Super Administrator',
  }[role] || role;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#0EA5E9,#6366F1);padding:40px 40px 32px;text-align:center;">
                  <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;font-weight:700;">Welcome to TBI</h1>
                  <p style="margin:0;color:rgba(255,255,255,0.9);font-size:15px;">Your account has been created</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 20px;font-size:16px;color:#111827;line-height:1.6;">
                    Hi <strong>${name}</strong>,
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                    An administrator has created an account for you on the TBI Workforce Platform. 
                    Your role is: <strong style="color:#0EA5E9;">${tierLabel}</strong>
                  </p>
                  
                  <!-- Credentials Box -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:24px;">
                        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
                          Your Login Credentials
                        </p>
                        
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:8px 0;font-size:14px;color:#6b7280;width:120px;">Email</td>
                            <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${to}</td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0;font-size:14px;color:#6b7280;">Temp Password</td>
                            <td style="padding:8px 0;font-size:16px;color:#111827;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px;">
                              ${tempPassword}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Warning -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px;">
                        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#92400e;">
                          Important — One-Time Use
                        </p>
                        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">
                          This password can only be used <strong>once</strong>. You will be required to 
                          set a new password immediately after your first login. Do not share these credentials with anyone.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:8px 0 32px;">
                        <a href="${loginUrl}" style="display:inline-block;background:#0EA5E9;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                          Sign In to Platform
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                    If you did not expect this email or believe it was sent in error, please contact 
                    your TBI administrator immediately.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    TBI Workforce Platform — Automated notification. Do not reply.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Welcome to TBI, ${name}!

Your account has been created on the TBI Workforce Platform.
Role: ${tierLabel}

Login Credentials:
  Email: ${to}
  Temp Password: ${tempPassword}

IMPORTANT: This password is one-time use only. You will be required to set a new password on first login.

Sign in here: ${loginUrl}

If you did not expect this email, contact your TBI administrator.
  `;

  return await sendEmail({
    to,
    subject: 'Your TBI Account Credentials',
    html,
    text,
  });
};

// ====================================================================
// OTHER EMAIL TEMPLATES (extend later)
// ====================================================================
const sendPasswordResetEmail = async ({ to, name, tempPassword, loginUrl }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
              <tr>
                <td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:40px 40px 32px;text-align:center;">
                  <h1 style="margin:0 0 8px;color:#ffffff;font-size:26px;font-weight:700;">Password Reset</h1>
                  <p style="margin:0;color:rgba(255,255,255,0.9);font-size:15px;">Your temporary password is ready</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 20px;font-size:16px;color:#111827;line-height:1.6;">
                    Hi <strong>${name}</strong>,
                  </p>
                  <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                    An administrator has reset your account password. Use the temporary password below to sign in.
                  </p>
                  
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:24px;">
                        <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
                          New Temporary Password
                        </p>
                        <p style="margin:0;font-size:20px;color:#111827;font-weight:700;font-family:'Courier New',monospace;letter-spacing:2px;text-align:center;padding:12px;background:#ffffff;border-radius:6px;border:1px dashed #d1d5db;">
                          ${tempPassword}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px;">
                        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#92400e;">
                          One-Time Use Only
                        </p>
                        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">
                          This password can only be used <strong>once</strong>. You will be required to set a new password immediately after signing in.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:8px 0 32px;">
                        <a href="${loginUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                          Sign In Now
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                    If you did not request this reset, contact your TBI administrator immediately.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    TBI Workforce Platform — Automated notification. Do not reply.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
Password Reset - TBI Platform

Hi ${name},

Your password has been reset. Use this temporary password to sign in:
  ${tempPassword}

IMPORTANT: This password is one-time use only. You will be forced to set a new password after signing in.

Sign in: ${loginUrl}
  `;

  return await sendEmail({
    to,
    subject: 'Your TBI Password Has Been Reset',
    html,
    text,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
