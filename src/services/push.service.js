/**
 * Service Push Notification
 * (Mock – prêt pour Firebase / OneSignal)
 */
async function send(dest, communique) {
  try {
    console.log("🔔 PUSH ENVOYÉ");
    console.log("→ Destinataire :", dest.id);
    console.log("→ Titre :", communique.titre);
    console.log("→ Message :", communique.message || communique.contenu);

    await new Promise((r) => setTimeout(r, 300));

    return { success: true, providerId: "PUSH_MOCK_001" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default { send };