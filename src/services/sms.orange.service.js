// src/services/sms.orange.service.js
import axios from "axios";
import { normalizeCI } from "../utils/phone.js";

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * 🔐 Récupération du token OAuth2 Orange
 */
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const auth = Buffer.from(
    `${process.env.ORANGE_CLIENT_ID}:${process.env.ORANGE_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const res = await axios.post(
      process.env.ORANGE_TOKEN_URL,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    cachedToken = res.data.access_token;
    tokenExpiresAt = now + (res.data.expires_in - 120) * 1000;

    console.log(
      "✅ Token Orange obtenu, expire dans:",
      res.data.expires_in,
      "secondes"
    );
    return cachedToken;
  } catch (error) {
    console.error("❌ Erreur d'obtention du token Orange:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw new Error(`Échec d'authentification Orange: ${error.message}`);
  }
}

/**
 * 📤 Envoi SMS via Orange
 */
async function send(dest, communique) {
  const to = normalizeCI(dest.contact1 || dest.phone);
  if (!to) {
    throw new Error("Numéro destinataire invalide");
  }

  const token = await getAccessToken();

  // URL correcte pour l'API Orange
  const senderAddress = encodeURIComponent(
    process.env.ORANGE_SENDER_ADDRESS || "tel:+225894650"
  );
  const url = `https://api.orange.com/smsmessaging/v1/outbound/${senderAddress}/requests`;

  // Payload selon documentation Orange
  const payload = {
    outboundSMSMessageRequest: {
      address: [`tel:${to}`],
      senderAddress: process.env.ORANGE_SENDER_ADDRESS || "tel:+225894650",
      senderName: process.env.ORANGE_SENDER_NUMBER || "894650",
      outboundSMSTextMessage: {
        message: communique.titre + "\n\n" + (communique.contenu || ""),
      },
      clientCorrelator: `bidjante_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    },
  };

  console.log("📤 Tentative d'envoi SMS Orange:", {
    to,
    sender: payload.outboundSMSMessageRequest.senderAddress,
    messageLength:
      payload.outboundSMSMessageRequest.outboundSMSTextMessage.message.length,
    url: url.substring(0, 80) + "...",
  });

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    // Récupérer l'URL de suivi (resourceURL)
    const trackingUrl = res.data?.outboundSMSMessageRequest?.resourceURL;
    const messageId = res.data?.outboundSMSMessageRequest?.clientCorrelator;

    console.log("✅ SMS Orange envoyé avec succès →", to);

    if (trackingUrl) {
      console.log("📍 URL de suivi:", trackingUrl);
    }

    // Retour simplifié pour le diffuseur
    return {
      success: true,
      trackingUrl: trackingUrl,
      messageId: messageId,
      message: `SMS envoyé à ${to}`,
    };
  } catch (error) {
    console.error("❌ Échec d'envoi SMS Orange:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    let errorMessage = `Erreur API Orange (${
      error.response?.status || "No status"
    })`;
    if (error.response?.data) {
      if (error.response.data.error) {
        errorMessage += `: ${error.response.data.error}`;
      }
      if (error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      }
    }

    throw new Error(errorMessage);
  }
}

export default { send };
