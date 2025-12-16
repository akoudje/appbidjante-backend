import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendReceiptEmail({
  email,
  nom,
  montant,
  soldeRestant,
  pdfBuffer,
}) {
  if (!email) return;

  await transporter.sendMail({
    from: `"Village de Bidjanté" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Reçu de paiement – Village de Bidjanté",
    html: `
      <p>Bonjour <strong>${nom}</strong>,</p>
      <p>Veuillez trouver ci-joint votre reçu de paiement.</p>
      <ul>
        <li><strong>Total payé :</strong> ${montant.toLocaleString()} FCFA</li>
        <li><strong>Solde restant dû :</strong> ${soldeRestant.toLocaleString()} FCFA</li>
      </ul>
      <p>Cordialement,<br/>Village de Bidjanté</p>
    `,
    attachments: [
      {
        filename: `recu_${Date.now()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
