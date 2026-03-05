import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Email sending utility
 * Uses Nodemailer with environment-based configuration
 * Supports: SMTP, Gmail, SendGrid, etc.
 */

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter based on environment variables
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  // Use environment-based configuration
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Default to Gmail if no host specified but credentials provided
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development mode: use ethereal (testing service)
    // In production, this will log a warning but not fail
    console.warn(
      "[Email] No email credentials found in environment variables. " +
      "Set EMAIL_USER and EMAIL_PASSWORD to enable email sending. " +
      "Supported: Gmail, SMTP, or any Nodemailer-compatible service."
    );

    // Return a mock transporter for development
    transporter = {
      sendMail: async (options: any) => {
        console.log("[Email] Mock email (development):", {
          to: options.to,
          subject: options.subject,
        });
        return { messageId: "mock-" + Date.now() };
      },
    } as nodemailer.Transporter;
  }

  return transporter;
}

/**
 * Send an email
 * @param options Email options (to, subject, html)
 * @returns Promise with message ID if successful
 */
export async function sendEmail(options: EmailOptions): Promise<string> {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@lamas.edu",
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`[Email] Sent to ${options.to} (ID: ${result.messageId})`);
    return result.messageId;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Email] Failed to send email:", errorMsg);

    // In development, log but don't throw
    if (process.env.NODE_ENV === "development") {
      console.warn("[Email] Email failed in development mode. Configure EMAIL_* environment variables for production.");
      return `dev-mock-${Date.now()}`;
    }

    throw new Error(`Failed to send email: ${errorMsg}`);
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<string> {
  return sendEmail({
    to: email,
    subject: "LAMAS - Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset for your LAMAS account.</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
          ">
            Reset Password
          </a>
        </p>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">LAMAS - Learning Assessment & Management System</p>
      </div>
    `,
  });
}

/**
 * Send an account creation notification email
 */
export async function sendAccountCreatedEmail(
  email: string,
  name: string,
  tempPassword: string,
  role: string
): Promise<string> {
  return sendEmail({
    to: email,
    subject: "LAMAS - Account Created",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Welcome to LAMAS</h2>
        <p>Hi ${name},</p>
        <p>An account has been created for you as a <strong>${role}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 3px;">${tempPassword}</code></p>
        </div>
        <p style="color: #666;">Please log in and change your password immediately.</p>
        <p style="color: #999; font-size: 12px;">If you have any issues, please contact your administrator.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">LAMAS - Learning Assessment & Management System</p>
      </div>
    `,
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string
): Promise<string> {
  return sendEmail({
    to: email,
    subject: `LAMAS - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">${subject}</h2>
        <p>${message}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">LAMAS - Learning Assessment & Management System</p>
      </div>
    `,
  });
}

/**
 * Verify email configuration (for debugging)
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn("[Email] Email not configured. Set EMAIL_USER and EMAIL_PASSWORD.");
      return false;
    }

    const transporter = getTransporter();
    await transporter.verify();
    console.log("[Email] Configuration verified successfully");
    return true;
  } catch (error) {
    console.error("[Email] Configuration verification failed:", error);
    return false;
  }
}
