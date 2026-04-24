import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
console.log("ENV EMAIL:", process.env.EMAIL);
console.log("ENV PASS:", process.env.EMAIL_PASSWORD);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log("Sending email to:", to);

    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent to:", to);
  } catch (err) {
    console.log("EMAIL ERROR FULL:", err);
  }
};