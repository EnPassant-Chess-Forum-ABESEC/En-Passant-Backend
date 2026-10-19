import { Resend } from "resend";
import nodemailer from "nodemailer";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const formattedAttachments = attachments
    ? attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content)
          ? a.content
          : Buffer.from(a.content, "base64"),
        contentType: a.contentType || a.content_type || "application/pdf",
      }))
    : [];

  const sendViaSmtp = async () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return false;
    }
    const transporter = getTransporter();
    const mailOptions = {
      from:
        process.env.SMTP_FROM_EMAIL ||
        `"En-Passant" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text,
      attachments: formattedAttachments,
    };
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent successfully to ${to}`);
    return true;
  };

  try {
    const isDev = process.env.NODE_ENV !== "production";

    if (isDev && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return await sendViaSmtp();
    }

    if (process.env.RESEND_API_KEY) {
      const msg = {
        to,
        from: process.env.RESEND_FROM_EMAIL || "support@enpassant.co.in",
        subject,
        text,
        html: html || text,
      };

      if (formattedAttachments.length > 0) {
        msg.attachments = formattedAttachments.map((a) => ({
          filename: a.filename,
          content: a.content,
        }));
      }

      const { data, error } = await resend.emails.send(msg);

      if (error) {
        console.error("[Resend] Error sending email:", error);
        return await sendViaSmtp();
      }

      console.log(`[Resend] Email sent successfully to ${to}`);
      return true;
    }

    return await sendViaSmtp();
  } catch (error) {
    console.error("Error sending email:", error);
    try {
      return await sendViaSmtp();
    } catch (smtpErr) {
      console.error("SMTP fallback error:", smtpErr);
      return false;
    }
  }
};
