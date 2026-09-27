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
  try {
    const isDev = process.env.NODE_ENV !== "production";
    
    // For development, use SMTP (Nodemailer) to save Resend credits
    if (isDev && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = getTransporter();
      const mailOptions = {
        from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
        to,
        subject,
        text,
        html: html || text,
        attachments: attachments ? attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.content_type // Map resend attachment format to nodemailer
        })) : []
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Email sent successfully to ${to}`);
      return true;
    }

    // Fallback to Resend for Production
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Email will not be sent.");
      return false;
    }

    const msg = {
      to,
      from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
      subject,
      text,
      html: html || text,
    };

    if (attachments && attachments.length > 0) {
      msg.attachments = attachments;
    }

    const { data, error } = await resend.emails.send(msg);

    if (error) {
      console.error("[Resend] Error sending email:", error);
      return false;
    }

    console.log(`[Resend] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
