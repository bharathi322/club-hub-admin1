import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "test@gmail.com",
        pass: process.env.EMAIL_PASS || "password",
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER || "test@gmail.com",
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent to", to);
  } catch (error) {
    console.error("Email error:", error.message);
  }
};