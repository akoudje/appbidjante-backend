// services/diffusion.manager.js

import prisma from "../prisma.js";
import { resolveDestinataires } from "../helpers/resolveDestinataires.js";

import { v4 as uuid } from "uuid";
import sms from "./sms.service.js";
import email from "./email.service.js";
import whatsapp from "./whatsapp.service.js";
import push from "./push.service.js";

const CANAUX = {
  SMS: sms,
  EMAIL: email,
  WHATSAPP: whatsapp,
  PUSH: push,
};

export async function diffuserCommunique(communique, type = "PUBLICATION") {
  const batchId = uuid();

  const destinataires = await resolveDestinataires(communique);
  const totalCibles = destinataires.length;

  console.log("🚀 DIFFUSION COMMUNIQUE :", {
    id: communique.id,
    titre: communique.titre,
    canaux: communique.canaux,
    totalCibles,
  });

  // 1️⃣ créer le batch
  await prisma.diffusionBatch.create({
    data: {
      id: batchId,
      communiqueId: communique.id,
      type,
      totalCibles,
      totalEnvoyes: 0,
      totalEchecs: 0,
    },
  });

  let totalEnvoyes = 0;
  let totalEchecs = 0;

  // 🔁 CANAUX
  for (const canal of communique.canaux) {
    const service = CANAUX[canal];
    if (!service) continue;

    // 🔁 DESTINATAIRES
    for (const dest of destinataires) {
      let cible = null;

      if (canal === "EMAIL") cible = dest.email;
      if (canal === "SMS" || canal === "WHATSAPP") cible = dest.contact1;
      if (canal === "PUSH") cible = dest.id;

      if (!cible) continue;

      console.log("📤 ENVOI", canal, "→", cible);

      try {
        await service.send(dest, communique);
        totalEnvoyes++;

        await prisma.diffusionHistorique.create({
          data: {
            communiqueId: communique.id,
            batchId,
            canal,
            destinataire: cible,
            statut: "ENVOYE",
          },
        });
      } catch (e) {
        totalEchecs++;

        await prisma.diffusionHistorique.create({
          data: {
            communiqueId: communique.id,
            batchId,
            canal,
            destinataire: cible,
            statut: "ECHEC",
            messageRetour: e.message,
          },
        });
      }
    }
  }

  // 2️⃣ finaliser le batch
  await prisma.diffusionBatch.update({
    where: { id: batchId },
    data: {
      totalEnvoyes,
      totalEchecs,
      finishedAt: new Date(),
    },
  });

  return { batchId, totalCibles, totalEnvoyes, totalEchecs };
}