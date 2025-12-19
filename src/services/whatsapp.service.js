/**
 * Service WhatsApp
 * (Mock – prêt pour WhatsApp Business API / Twilio)
 */
async function send(dest, communique) {
  try {
    console.log("💬 WHATSAPP ENVOYÉ");
    console.log("→ Numéro :", dest.contact1);
    console.log("→ Message :", communique.message || communique.contenu);

    await new Promise((r) => setTimeout(r, 300));

    return { success: true, providerId: "WHATSAPP_MOCK_001" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default { send };