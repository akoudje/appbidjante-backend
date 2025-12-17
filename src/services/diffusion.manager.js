// services/diffusion.manager.js
import prisma from "../prisma.js";
import { resolveDestinataires } from "../helpers/resolveDestinataires.js";
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

export async function diffuserCommunique(communique) {
  const destinataires = await resolveDestinataires(communique);

  for (const canal of communique.canaux) {
    const service = CANAUX[canal];
    if (!service) continue;

    for (const dest of destinataires) {
      try {
        await service.send(dest, communique);
        await prisma.diffusionHistorique.create({
          data: {
            communiqueId: communique.id,
            canal,
            destinataire: dest,
            statut: "ENVOYE",
          },
        });
      } catch (e) {
        await prisma.diffusionHistorique.create({
          data: {
            communiqueId: communique.id,
            canal,
            destinataire: dest,
            statut: "ECHEC",
            messageRetour: e.message,
          },
        });
      }
    }
  }
}
