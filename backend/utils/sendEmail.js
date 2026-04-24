import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_app_password"
  }
});

export const sendEmail = async (to, password) => {
  try {
    const info = await transporter.sendMail({
      from: "your_email@gmail.com",
      to,
      subject: "Club Assignment Credentials",
      text: `You are assigned to a club.\nYour password: ${password}`
    });

    console.log("Mail sent:", info.response);
  } catch (err) {
    console.log("Mail error:", err);
  }
};