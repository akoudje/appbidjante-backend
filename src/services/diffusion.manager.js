// services/diffusion.manager.js

import prisma from "../prisma.js";
import { resolveDestinataires } from "../helpers/resolveDestinataires.js";

import { v4 as uuid } from "uuid";
import sms from "./sms.orange.service.js";
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

  console.log("🚀 LANCEMENT DIFFUSION COMMUNIQUE :", {
    id: communique.id,
    titre: communique.titre,
    canaux: communique.canaux,
    totalCibles,
    batchId
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
      startedAt: new Date(),
    },
  });

  let totalEnvoyes = 0;
  let totalEchecs = 0;
  let statsParCanal = {
    SMS: { envoyes: 0, echecs: 0 },
    EMAIL: { envoyes: 0, echecs: 0 },
    WHATSAPP: { envoyes: 0, echecs: 0 },
    PUSH: { envoyes: 0, echecs: 0 },
  };

  // 🔁 CANAUX
  for (const canal of communique.canaux) {
    const service = CANAUX[canal];
    if (!service) {
      console.warn(`⚠️ Canal non supporté: ${canal}`);
      continue;
    }

    console.log(`📡 Traitement canal: ${canal}`);
    
    // 🔁 DESTINATAIRES
    for (const dest of destinataires) {
      let cible = null;

      if (canal === "EMAIL") cible = dest.email;
      if (canal === "SMS" || canal === "WHATSAPP") cible = dest.contact1 || dest.phone;
      if (canal === "PUSH") cible = dest.id;

      if (!cible) {
        console.log(`⏭️ ${canal}: Pas de cible pour ${dest.id || dest.nom}, ignoré`);
        continue;
      }

      console.log(`📤 ENVOI ${canal} →`, 
        canal === "SMS" ? cible : 
        canal === "EMAIL" ? cible.substring(0, 10) + "..." : 
        cible
      );

      try {
        const result = await service.send(dest, communique);
        totalEnvoyes++;
        statsParCanal[canal].envoyes++;

        // ✅ SOLUTION : Stocker l'info dans messageRetour avec un format structuré
        let messageRetour = "";
        
        if (canal === "SMS" && result.trackingUrl) {
          // Format JSON dans messageRetour pour faciliter l'extraction
          const smsInfo = {
            type: "sms_success",
            trackingUrl: result.trackingUrl,
            messageId: result.messageId || null,
            status: "envoyé",
            provider: "orange",
            timestamp: new Date().toISOString()
          };
          messageRetour = JSON.stringify(smsInfo);
        } else if (canal === "SMS") {
          messageRetour = "SMS envoyé avec succès (pas d'URL de suivi)";
        } else {
          messageRetour = result.message || "Envoyé avec succès";
        }

        await prisma.diffusionHistorique.create({
          data: {
            communiqueId: communique.id,
            batchId,
            canal,
            destinataire: cible,
            statut: "ENVOYE",
            messageRetour: messageRetour,
            sentAt: new Date(),
          },
        });
        
        console.log(`✅ ${canal} envoyé avec succès à ${cible}`);
        if (result.trackingUrl) {
          console.log(`   🔗 URL de suivi: ${result.trackingUrl}`);
        }
        
      } catch (e) {
        totalEchecs++;
        statsParCanal[canal].echecs++;
        
        const errorMessage = e.message.length > 500 ? e.message.substring(0, 500) + "..." : e.message;
        
        // Pour les échecs, stocker un JSON structuré aussi
        const errorInfo = {
          type: "error",
          error: errorMessage,
          provider: "orange",
          timestamp: new Date().toISOString()
        };
        
        await prisma.diffusionHistorique.create({
          data: {
            communiqueId: communique.id,
            batchId,
            canal,
            destinataire: cible,
            statut: "ECHEC",
            messageRetour: JSON.stringify(errorInfo),
            sentAt: new Date(),
          },
        });
        
        console.error(`❌ ${canal} échec pour ${cible}:`, errorMessage.substring(0, 100));
      }
      
      // Petite pause pour éviter le rate limiting (surtout pour SMS)
      if (canal === "SMS") {
        await new Promise(resolve => setTimeout(resolve, 100));
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

  console.log("🏁 DIFFUSION TERMINÉE:", {
    batchId,
    totalCibles,
    totalEnvoyes,
    totalEchecs,
    statsParCanal
  });

  return { 
    batchId, 
    totalCibles, 
    totalEnvoyes, 
    totalEchecs,
    statsParCanal 
  };
}