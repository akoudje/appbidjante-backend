// prisma/sidebarSeed.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function sidebarSeed() {
  console.log("➡️ Création des groupes…");

  const groupsData = [
    { id: 1, name: "Navigation", code: "NAVIGATION", order: 1 },
    { id: 2, name: "Finances", code: "FINANCES", order: 2 },
    { id: 3, name: "Administration", code: "ADMIN", order: 3 },
  ];

  for (const g of groupsData) {
    await prisma.menuGroup.upsert({
      where: { id: g.id },
      update: { name: g.name, order: g.order, code: g.code },
      create: g,
    });
  }

  console.log("➡️ Synchronisation des MenuItem…");

  const items = [
    { label: "Tableau de bord", path: "/", icon: "FaHome", order: 1, minRole: "user", groupId: 1 },
    { label: "Acoubè pasà — Membres du village", path: "/VillageMembers", icon: "FaUsers", order: 2, minRole: "user", groupId: 1 },
    { label: "Abè pasa — Génération & catégories", path: "/villagegroups", icon: "FaUsers", order: 3, minRole: "user", groupId: 1 },
    { label: "Alitchan — Décès & funérailles", path: "/funerailles", icon: "GiCoffin", order: 4, minRole: "user", groupId: 1 },
    { label: "abatchaté pin — Contributions financières", path: "/contributions", icon: "GiReceiveMoney", order: 1, minRole: "user", groupId: 2 },
    { label: "M'mon domon — Contributions des familles", path: "/cotisationslignees", icon: "FaHandsHelping", order: 2, minRole: "user", groupId: 2 },
    { label: "Bilan annuel", path: "/bilan-annuel", icon: "ChartBarIcon", order: 3, minRole: "user", groupId: 2 },
    { label: "Utilisateurs — Gestion", path: "/usersmanagements", icon: "FaUserCircle", order: 1, minRole: "admin", groupId: 3 },
    { label: "Configurations — Paramètres", path: "/admin/menu", icon: "GiSettingsKnobs", order: 2, minRole: "admin", groupId: 3 },
  ];

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { path: item.path },
      update: item,
      create: item,
    });
  }

  console.log("✔ Sidebar seed terminé !");
}
