import { Resend } from "resend";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Resend Email Service
 * High-standard, professional email delivery for the LAMAS platform.
 */

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const SENDER = process.env.EMAIL_FROM || "onboarding@resend.dev";

/**
 * Premium "Academic Standard" Base Template.
 * Focuses on high legibility, clean spacing, and modern corporate branding.
 */
const getBaseTemplate = (content: string, title: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: 'Inter', system-ui, -apple-system, sans-serif; 
          line-height: 1.625; 
          color: #1e293b; 
          margin: 0; 
          padding: 0; 
          background-color: #f1f5f9; 
          -webkit-font-smoothing: antialiased;
        }
        .container { 
          max-width: 640px; 
          margin: 60px auto; 
          padding: 0 20px;
        }
        .wrapper { 
          background: #ffffff; 
          border-radius: 16px; 
          overflow: hidden; 
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); 
          border: 1px solid #e2e8f0; 
        }
        .brand-header { 
          padding: 32px 40px; 
          border-bottom: 1px solid #f1f5f9;
          text-align: left;
        }
        .brand-logo { 
          display: inline-block;
          font-weight: 800; 
          font-size: 18px; 
          color: #0f172a; 
          letter-spacing: -0.02em;
          text-transform: uppercase;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 4px;
        }
        .content { 
          padding: 40px; 
        }
        .content h1, .content h2 {
          color: #0f172a;
          font-size: 24px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 16px;
          letter-spacing: -0.025em;
        }
        .footer { 
          padding: 32px 40px; 
          text-align: left; 
          border-top: 1px solid #f1f5f9;
          color: #64748b; 
          font-size: 13px; 
        }
        .btn { 
          display: inline-block; 
          padding: 12px 32px; 
          background-color: #4f46e5; 
          color: #ffffff !important; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 14px; 
          margin: 24px 0;
          transition: background-color 0.2s;
        }
        .alert-badge {
          display: inline-block;
          background: #eef2ff;
          color: #4f46e5;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
        }
        .detail-box { 
          background: #f8fafc; 
          border: 1px solid #f1f5f9; 
          border-radius: 12px; 
          padding: 24px; 
          margin: 24px 0; 
        }
        p { margin-bottom: 20px; font-size: 15px; color: #475569; }
        .divider { height: 1px; background: #f1f5f9; margin: 32px 0; }
        @media (max-width: 600px) {
          .container { margin: 20px auto; }
          .content { padding: 32px 24px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="wrapper">
          <div class="brand-header">
            <div class="brand-logo">LAMAS</div>
          </div>
          <div class="content">
            <div class="alert-badge">${title}</div>
            ${content}
          </div>
          <div class="footer">
            <p style="margin: 0; font-weight: 500; color: #334155;">Learning Assessment & Management System</p>
            <p style="margin: 8px 0 0 0; opacity: 0.8;">Integrated Academic Communication Gateway</p>
            <div style="margin-top: 24px; font-size: 11px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} LAMAS Platform. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

/**
 * Send an email using Resend SDK
 */
export async function sendEmail(options: EmailOptions): Promise<string> {
  try {
    if (!resend) {
      console.log("\n--- [DEVELOPMENT MAIL MOCK] ---");
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log("-------------------------------\n");
      return `dev-mock-${Date.now()}`;
    }

    const { data, error } = await resend.emails.send({
      from: SENDER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      throw new Error(error.message);
    }

    console.log(`[Email] Sent to ${options.to} (ID: ${data?.id})`);
    return data?.id || `resend-${Date.now()}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Email] Fatal failure:", errorMsg);

    if (process.env.NODE_ENV === "development") {
      console.warn("[Email] Failure ignored in development mode.");
      return `error-fallback-${Date.now()}`;
    }

    throw new Error(`Failed to send email: ${errorMsg}`);
  }
}

/**
 * Professional Password Reset Template
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<string> {
  const html = getBaseTemplate(`
    <h1>Security Update</h1>
    <p>Hi ${name},</p>
    <p>A request was made to securely reset your password for the LAMAS platform. To continue with this request, please use the button below:</p>
    <div style="text-align: left;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="divider"></div>
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">For your protection, this link will expire in 1 hour. If you did not initiate this request, please contact your System Administrator immediately.</p>
  `, "Authentication Status");

  return sendEmail({ to: email, subject: "Action Required: Secure your LAMAS Account", html });
}

/**
 * Smart URL Detector
 * Automatically determines the base URL for the project.
 */
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

/**
 * Professional Account Provisioning Template
 */
export async function sendAccountCreatedEmail(
  email: string,
  name: string,
  tempPassword: string,
  role: string
): Promise<string> {
  const html = getBaseTemplate(`
    <h1>Welcome to LAMAS</h1>
    <p>Greetings ${name},</p>
    <p>An official academic account has been provisioned for you with the assigned role of <strong>${role}</strong>.</p>
    <p>Your access credentials are securely generated below:</p>
    <div class="detail-box">
      <p style="margin: 0; font-size: 14px;"><strong>Portal Address:</strong> <code style="color: #4f46e5;">${email}</code></p>
      <p style="margin: 12px 0 0 0; font-size: 14px;"><strong>Initial Access Key:</strong> <code style="color: #4f46e5;">${tempPassword}</code></p>
    </div>
    <p>Upon your first login, you will be required to establish a high-security personal password.</p>
    <div style="text-align: left;">
      <a href="${getBaseUrl()}" class="btn">Access the Portal</a>
    </div>
  `, "Account Provisioned");

  return sendEmail({ to: email, subject: "Welcome to LAMAS - Your Academic Credentials", html });
}

/**
 * Professional Notification Template
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string
): Promise<string> {
  const html = getBaseTemplate(`
    <h1>${subject}</h1>
    <div style="font-size: 16px; color: #334155; line-height: 1.7;">
      ${message.split('\n').map(p => `<p>${p}</p>`).join('')}
    </div>
    <div style="text-align: left;">
      <a href="${getBaseUrl()}" class="btn">Review Dashboard</a>
    </div>
  `, "System Broadcast");

  return sendEmail({ to: email, subject: `LAMAS Notification: ${subject}`, html });
}

/**
 * Verify configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!resend) {
    console.warn("[Email] Resend API Key missing. Service running in MOCK mode.");
    return false;
  }
  return true;
}
