/**
 * Service WhatsApp
 * (Mock – prêt pour WhatsApp Business API / Twilio)
 */
export async function sendWhatsApp({ to, message }) {
  try {
    console.log("💬 WHATSAPP ENVOYÉ");
    console.log("→ Numéro :", to);
    console.log("→ Message :", message);

    await new Promise((r) => setTimeout(r, 300));

    return {
      success: true,
      providerId: "WHATSAPP_MOCK_001",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
export default { sendWhatsApp };