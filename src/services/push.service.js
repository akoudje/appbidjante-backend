/**
 * Service Push Notification
 * (Mock – prêt pour Firebase / OneSignal)
 */
export async function sendPush({ to, title, body }) {
  try {
    console.log("🔔 PUSH ENVOYÉ");
    console.log("→ Destinataire :", to);
    console.log("→ Titre :", title);
    console.log("→ Message :", body);

    await new Promise((r) => setTimeout(r, 300));

    return {
      success: true,
      providerId: "PUSH_MOCK_001",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
export default { sendPush };