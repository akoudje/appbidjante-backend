/**
 * Service Email
 * (Mock – prêt pour Nodemailer, SendGrid, Mailgun)
 */
export async function sendEmail({ to, subject, html }) {
  try {
    console.log("📧 EMAIL ENVOYÉ");
    console.log("→ À :", to);
    console.log("→ Sujet :", subject);
    console.log("→ Contenu :", html);

    await new Promise((r) => setTimeout(r, 300));

    return {
      success: true,
      providerId: "EMAIL_MOCK_001",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default { sendEmail };
