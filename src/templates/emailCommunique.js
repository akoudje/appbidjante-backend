// src/templates/emailCommunique.js

/**
 * Fonction pour rendre un email de communiqué avec le logo du village
 * @param {Object} communique - Données du communiqué
 * @returns {string} HTML de l'email
 */
export function renderEmailCommunique(communique) {
  const contenu = communique.contenu || communique.message || "";
  const type = communique.type || "GENERAL";
  const createdAt = communique.createdAt
    ? new Date(communique.createdAt)
    : new Date();

  // Configuration de l'URL de base
  const BASE_URL = process.env.APP_URL || "http://localhost:4000";
  const LOGO_PATH = "/uploads/assets/pdf/logo-bidjante.png";
  const LOGO_URL = `${BASE_URL}${LOGO_PATH}`;

  // Formatage de la date
  const formattedDate = createdAt.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Mapping des couleurs par type de communiqué
  const typeColors = {
    GENERAL: { bg: "#1e40af", text: "Communiqué Général", icon: "📢" },
    REUNION: { bg: "#059669", text: "Réunion", icon: "👥" },
    CONVOCATION: { bg: "#7c3aed", text: "Convocation", icon: "📅" },
    DECES: { bg: "#6b7280", text: "Annonce de Décès", icon: "⚰️" },
    COTISATION: { bg: "#d97706", text: "Cotisation", icon: "💰" },
    GRIOT: { bg: "#b45309", text: "Annonce du Griot", icon: "🗣️" },
    URGENT: { bg: "#dc2626", text: "Urgent", icon: "🚨" },
  };

  const typeConfig = typeColors[type] || typeColors.GENERAL;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${communique.titre} | Village de Bidjanté</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* Styles inline pour compatibilité email */
    @media only screen and (max-width: 760px) {
      .container {
        width: 100% !important;
      }
      .content {
        padding: 20px !important;
      }
      .logo {
        width: 100px !important;
        height: 100px !important;
      }
      h1 {
        font-size: 24px !important;
      }
      h2 {
        font-size: 22px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: 'Inter', 'Noto Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!--[if mso]>
  <table width="760" align="center" cellpadding="0" cellspacing="0" border="0">
  <tr>
  <td>
  <![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px; background-color:#ffffff;">
    <tr>
      <td align="center">
        <table width="760" cellpadding="0" cellspacing="0" class="container"
          style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); border:1px solid #e2e8f0; max-width:760px;">

          <!-- EN-TÊTE AVEC LOGO SUR FOND BLANC -->
          <tr>
            <td style="background: #ffffff; padding:40px 20px 20px 20px; text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- LOGO BIDJANTÉ SUR FOND BLANC -->
                    <div style="margin-bottom:10px;">
                      <img src="${LOGO_URL}" 
                           alt="Logo du Village de Bidjanté" 
                           width="120" 
                           height="120"
                           class="logo"
                           style="background:#ffffff; display:block; margin:0 auto;"/>
                    </div>
                    
                    <!-- TITRE DU VILLAGE SUR FOND BLANC -->
                    <div style="margin-bottom:5px;">
                      <h3 style="margin:0; color:#1e40af; font-size:18px; font-weight:300; letter-spacing:-0.5px; line-height:1.2;">
                        CHEFFERIE TCHAGBA
                      </h3>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BANDEAU TYPE (après l'en-tête blanc) -->
          <tr>
            <td style="background:${
              typeConfig.bg
            }; padding:12px 20px; text-align:center;">
              <span style="color:#ffffff; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.8px;">
                ${typeConfig.icon} ${typeConfig.text}
              </span>
            </td>
          </tr>

          <!-- CARD CONTENU -->
          <tr>
            <td class="content" style="padding:32px 28px; color:#111827; background:#ffffff;">
              
              <!-- TITRE PRINCIPAL -->
            <h2 style="margin:0 0 10px 0; color:#0f172a; font-size:20px; font-weight:500; text-align:center; line-height:1.3; border-bottom:2px solid #e2e8f0; padding-bottom:18px;">
              ${communique.titre}
            </h2>


              <!-- CONTENU PRINCIPAL -->
              <div style="font-size:16px; line-height:1.7; color:#334155; margin-bottom:10px;">
                ${formatContenu(contenu)}
              </div>

              <!-- INFOS SUPPLEMENTAIRES -->
              ${
                communique.lieu || communique.dateEvenement
                  ? `
                <div style="margin-top:10px; padding:24px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;">
                  <h3 style="margin:0 0 10px 0; color:#0f172a; font-size:17px; font-weight:600; display:flex; align-items:center; gap:8px;">
                    <span style="background:${
                      typeConfig.bg
                    }; color:white; width:30px; height:30px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;">📋</span>
                    Informations pratiques
                  </h3>
                  ${
                    communique.lieu
                      ? `
                    <div style="margin:10px 0; color:#475569; display:flex; align-items:flex-start; gap:12px; padding:12px; background:white; border-radius:8px;">
                      <span style="font-size:20px; color:${typeConfig.bg};">📍</span>
                      <div>
                        <div style="font-weight:600; margin-bottom:4px; color:#1e40af;">Lieu</div>
                        <div>${communique.lieu}</div>
                      </div>
                    </div>
                  `
                      : ""
                  }
                  ${
                    communique.dateEvenement
                      ? `
                    <div style="margin:10px 0; color:#475569; display:flex; align-items:flex-start; gap:12px; padding:12px; background:white; border-radius:8px;">
                      <span style="font-size:20px; color:${
                        typeConfig.bg
                      };">⏰</span>
                      <div>
                        <div style="font-weight:600; margin-bottom:4px; color:#1e40af;">Date de l'événement</div>
                        <div>${formatDateEvenement(
                          communique.dateEvenement
                        )}</div>
                      </div>
                    </div>
                  `
                      : ""
                  }
                </div>
              `
                  : ""
              }

              <!-- SIGNATURE -->
              ${
                communique.signature
                  ? `
                </div>
              `
                  : `
              <div style="margin-top:10px;padding-top:10px; border-top:2px solid #e2e8f0; color:#64748b; font-style:italic; font-size:14px; font-weight:500; text-align:right;">
                La chefferie du village de Bidjanté
              </div>

              `
              }

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]>
  </td>
  </tr>
  </table>
  <![endif]-->
</body>
</html>
`;
}

// Fonction pour formater le contenu avec des paragraphes
function formatContenu(contenu) {
  if (!contenu)
    return '<p style="margin:0; color:#64748b; font-style:italic;">(Aucun contenu)</p>';

  // Séparer par doubles sauts de ligne
  const paragraphes = contenu.split(/\n\s*\n/).filter((p) => p.trim());

  if (paragraphes.length === 0) {
    return `<p style="margin:0 0 20px 0;">${contenu.replace(
      /\n/g,
      "<br/>"
    )}</p>`;
  }

  return paragraphes
    .map((paragraphe, index) => {
      const marginBottom = index === paragraphes.length - 1 ? "0" : "24px";
      return `<p style="margin:0 0 ${marginBottom} 0;">${paragraphe
        .trim()
        .replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");
}

// Fonction pour formater la date d'événement
function formatDateEvenement(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn("Erreur formatage date:", error);
    return dateString;
  }
}

// Fonction utilitaire pour obtenir l'URL du logo
export function getLogoUrl() {
  const BASE_URL = process.env.APP_URL || "http://localhost:4000";
  const LOGO_PATH = "/uploads/assets/pdf/logo-bidjante.png";
  return `${BASE_URL}${LOGO_PATH}`;
}
