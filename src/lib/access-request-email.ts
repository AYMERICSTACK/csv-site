import { Resend } from "resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.csviriat-foot.fr").replace(/\/$/, "");
}

function getMailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return {
    mailer: new Resend(apiKey),
    from,
  };
}

export async function sendAccessRequestAdminNotification({
  adminEmails,
  requesterName,
  requesterEmail,
  requesterPhone,
  commissionNames,
  signupNote,
}: {
  adminEmails: string[];
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  commissionNames: string[];
  signupNote?: string | null;
}) {
  const config = getMailConfig();
  const recipients = [...new Set(adminEmails.map((email) => email.trim()).filter(Boolean))];

  if (!config || recipients.length === 0) {
    console.warn(
      "[access-email] Notification demande d’accès non envoyée : configuration Resend ou destinataire admin manquant.",
    );
    return false;
  }

  const adminUrl = `${siteUrl()}/admin/demandes`;
  const commissions = commissionNames.length ? commissionNames.join(", ") : "Aucune commission";

  await Promise.all(
    recipients.map(async (to) => {
      const result = await config.mailer.emails.send({
        from: config.from,
        to,
        subject: `Nouvelle demande d’accès — ${requesterName}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:640px;margin:0 auto;padding:24px">
            <h1 style="font-size:24px;margin:0 0 16px">Nouvelle demande d’accès</h1>
            <p>Une nouvelle demande d’accès vient d’être envoyée sur le site du CS Viriat.</p>
            <div style="background:#f5f5f5;border-radius:14px;padding:16px;margin:18px 0">
              <strong>${escapeHtml(requesterName)}</strong><br>
              ${escapeHtml(requesterEmail)}<br>
              ${requesterPhone ? `${escapeHtml(requesterPhone)}<br>` : ""}
              <span><strong>Commission(s) :</strong> ${escapeHtml(commissions)}</span>
              ${signupNote ? `<br><span><strong>Précision :</strong> ${escapeHtml(signupNote)}</span>` : ""}
            </div>
            <p><a href="${adminUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Voir les demandes d’accès</a></p>
          </div>
        `,
      });

      if (result.error) {
        console.error("[access-email] Resend a refusé la notification admin :", result.error);
        throw new Error(result.error.message || "Erreur Resend lors de la notification admin.");
      }

      console.info("[access-email] Notification admin envoyée.", {
        resendId: result.data?.id ?? null,
      });
    }),
  );

  return true;
}

export async function sendAccessApprovedNotification({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string;
}) {
  const config = getMailConfig();

  if (!config) {
    console.warn(
      "[access-email] Email d’activation non envoyé : RESEND_API_KEY ou RESEND_FROM_EMAIL manquant.",
    );
    return false;
  }

  const recipient = userEmail.trim();
  if (!recipient) {
    console.warn("[access-email] Email d’activation non envoyé : destinataire vide.");
    return false;
  }

  const loginUrl = `${siteUrl()}/admin/login`;

  console.info("[access-email] Tentative d’envoi de l’email d’activation.");

  const result = await config.mailer.emails.send({
    from: config.from,
    to: [recipient],
    subject: "Ton accès CS Viriat est validé",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:640px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;margin:0 0 16px">Ton compte est activé ✅</h1>
        <p>Bonjour ${escapeHtml(userName)},</p>
        <p>Ta demande d’accès au site interne du CS Viriat a été validée. Tu peux maintenant te connecter avec l’adresse email et le mot de passe utilisés lors de ton inscription.</p>
        <p><a href="${loginUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Se connecter</a></p>
        <p style="color:#666;font-size:13px;margin-top:24px">Si tu n’es pas à l’origine de cette demande, contacte le club.</p>
      </div>
    `,
  });

  if (result.error) {
    console.error("[access-email] Resend a refusé l’email d’activation :", result.error);
    throw new Error(result.error.message || "Erreur Resend lors de l’email d’activation.");
  }

  console.info("[access-email] Email d’activation envoyé.", {
    resendId: result.data?.id ?? null,
  });

  return true;
}
