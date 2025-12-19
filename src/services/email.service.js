// backend/src/services/email.service.js
import nodemailer from "nodemailer";
import { renderEmailCommunique } from "../templates/emailCommunique.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});

let smtpVerified = false;

async function verifySMTP() {
  if (smtpVerified) return;
  await transporter.verify();
  smtpVerified = true;
  console.log("✅ SMTP vérifié avec succès");
}

async function send(dest, communique) {
  try {
    await verifySMTP();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: dest.email,
      subject: communique.titre,
      html: renderEmailCommunique(communique),
    });

    console.log("📧 EMAIL envoyé →", dest.email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ ERREUR EMAIL :", error.message);
    return { success: false, error: error.message };
  }
}

export default { send };
