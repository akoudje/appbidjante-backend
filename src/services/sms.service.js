/**
 * Service SMS
 * (Mock pour l’instant – prêt pour Twilio / Orange / MTN)
 */
export async function sendSMS({ to, message }) {
  try {
    console.log("📱 SMS ENVOYÉ");
    console.log("→ Destinataire :", to);
    console.log("→ Message :", message);

    // simulation délai réseau
    await new Promise((r) => setTimeout(r, 300));

    return {
      success: true,
      providerId: "SMS_MOCK_001",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
export default { sendSMS };