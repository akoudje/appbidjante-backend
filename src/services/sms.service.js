/**
 * Service SMS Orange CI
 * (Prêt pour Twilio / Orange / MTN)
 */

/* import axios from "axios";

let cachedToken = null;
let tokenExpiresAt = 0;

async function getOrangeToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await axios.post(
    process.env.ORANGE_TOKEN_URL,
    "grant_type=client_credentials",
    {
      auth: {
        username: process.env.ORANGE_CLIENT_ID,
        password: process.env.ORANGE_CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  cachedToken = res.data.access_token;
  tokenExpiresAt = now + res.data.expires_in * 1000 - 60000; // marge de sécurité

  return cachedToken;
}

async function send(dest, communique) {
  try {
    const token = await getOrangeToken();

    // Normalisation du numéro (remplace le 0 initial par +225)
    const msisdn = dest.contact1.replace(/^0/, "+225");

    const payload = {
      outboundSMSMessageRequest: {
        address: [`tel:${msisdn}`],
        senderAddress: process.env.ORANGE_SENDER,
        outboundSMSTextMessage: {
          message: communique.titre,
        },
      },
    };

    const res = await axios.post(process.env.ORANGE_SMS_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📱 SMS ORANGE RÉEL envoyé →", msisdn);

    return {
      success: true,
      providerId: res.data?.outboundSMSMessageRequest?.resourceURL || "ORANGE_SMS",
    };
  } catch (error) {
    console.error("❌ ERREUR SMS ORANGE :", error.message);
    return { success: false, error: error.message };
  }
}

export default { send }; */


/**
 * Service SMS Twilio
 * (Production-ready)
 */

// backend/src/services/sms.service.js

import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function normalizeCI(number) {
  if (!number) return null;

  let n = number.toString().replace(/\s+/g, "");

  if (n.startsWith("+")) return n;

  if (/^0\d{9}$/.test(n)) {
    return "+225" + n;
  }

  if (/^\d{10}$/.test(n)) {
    return "+225" + n;
  }

  return null;
}


async function send(dest, communique) {
  try {
    const to = normalizeCI(dest.contact1);
    if (!to) {
      console.warn("⚠️ Numéro invalide ignoré :", dest.contact1);
      return { success: false, error: "Numéro invalide" };
    }

    const message = await client.messages.create({
      body: `Bidjanté : ${communique.titre}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log("📱 SMS TWILIO envoyé →", to, "| SID:", message.sid);

    return { success: true, providerId: message.sid };
  } catch (error) {
    console.error("❌ ERREUR SMS TWILIO :", error.message);
    return { success: false, error: error.message };
  }
}

export default { send };