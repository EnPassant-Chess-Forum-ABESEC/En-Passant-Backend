import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
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

    const { data, error } = await resend.emails.send(msg);

    if (error) {
      console.error("Error sending email:", error);
      return false;
    }

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
