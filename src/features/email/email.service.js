import sgMail from "@sendgrid/mail";
import "dotenv/config";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn("SENDGRID_API_KEY is not set. Email will not be sent.");
      return false;
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
      subject,
      text,
      html: html || text,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};
