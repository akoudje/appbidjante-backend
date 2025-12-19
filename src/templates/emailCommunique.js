export function renderEmailCommunique(communique) {
  const contenu = communique.contenu || communique.message || "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${communique.titre}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:6px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:#1e40af; color:#ffffff; padding:16px 20px; font-size:20px; font-weight:bold;">
              📢 Bidjanté
            </td>
          </tr>

          <!-- CONTENU -->
          <tr>
            <td style="padding:24px; color:#111827;">
              <h2 style="margin-top:0; font-size:22px;">
                ${communique.titre}
              </h2>

              <p style="font-size:15px; line-height:1.6; color:#374151;">
                ${contenu.replace(/\n/g, "<br/>")}
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb; padding:14px 20px; font-size:12px; color:#6b7280;">
              Message envoyé via la plateforme <strong>Bidjanté</strong>.<br/>
              Merci de ne pas répondre directement à cet email.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
