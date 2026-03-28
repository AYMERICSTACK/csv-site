import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être renseignés." },
        { status: 400 },
      );
    }

    const clubEmail = "adjeridito@gmail.com";

    const clubMail = await resend.emails.send({
      from: "CS Viriat <onboarding@resend.dev>",
      to: [clubEmail],
      replyTo: email,
      subject: `[Contact site] ${subject}`,
      html: `
        <div style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,sans-serif;color:#171717;">
          <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
            <div style="background:#111111;border-radius:20px 20px 0 0;padding:24px 28px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                CS Viriat
              </div>
              <div style="margin-top:8px;font-size:13px;color:#ffffffb3;">
                Nouveau message depuis le formulaire de contact
              </div>
            </div>

            <div style="background:#ffffff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 20px 20px;padding:28px;">
              <div style="height:4px;width:72px;background:#f97316;border-radius:999px;margin-bottom:24px;"></div>

              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="padding:10px 0;color:#737373;font-weight:700;width:140px;">Prénom</td>
                  <td style="padding:10px 0;color:#171717;">${escapeHtml(firstName)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#737373;font-weight:700;">Nom</td>
                  <td style="padding:10px 0;color:#171717;">${escapeHtml(lastName)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#737373;font-weight:700;">Email</td>
                  <td style="padding:10px 0;color:#171717;">
                    <a href="mailto:${escapeHtml(email)}" style="color:#f97316;text-decoration:none;">
                      ${escapeHtml(email)}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#737373;font-weight:700;">Téléphone</td>
                  <td style="padding:10px 0;color:#171717;">
                    ${
                      phone
                        ? `<a href="tel:${escapeHtml(phone)}" style="color:#f97316;text-decoration:none;">${escapeHtml(phone)}</a>`
                        : '<span style="color:#a3a3a3;">Non renseigné</span>'
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#737373;font-weight:700;">Sujet</td>
                  <td style="padding:10px 0;color:#171717;">${escapeHtml(subject)}</td>
                </tr>
              </table>

              <div style="margin-top:24px;">
                <div style="font-size:14px;font-weight:700;color:#737373;margin-bottom:10px;">Message</div>
                <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:18px;font-size:14px;line-height:1.7;color:#171717;">
                  ${escapeHtml(message).replace(/\n/g, "<br />")}
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (clubMail.error) {
      return NextResponse.json(
        { error: "Échec de l’envoi de l’email au club." },
        { status: 500 },
      );
    }

    const userMail = await resend.emails.send({
      from: "CS Viriat <onboarding@resend.dev>",
      to: [email],
      subject: "Nous avons bien reçu votre message",
      html: `
        <div style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,sans-serif;color:#171717;">
          <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
            <div style="background:#111111;border-radius:20px 20px 0 0;padding:24px 28px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                CS Viriat
              </div>
              <div style="margin-top:8px;font-size:13px;color:#ffffffb3;">
                Confirmation de réception
              </div>
            </div>

            <div style="background:#ffffff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 20px 20px;padding:28px;">
              <div style="height:4px;width:72px;background:#f97316;border-radius:999px;margin-bottom:24px;"></div>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">
                Bonjour ${escapeHtml(firstName)},
              </p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#404040;">
                Nous avons bien reçu votre message envoyé via le site du
                <strong> CS Viriat</strong>.
              </p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#404040;">
                Notre équipe reviendra vers vous dans les meilleurs délais.
              </p>

              <div style="margin:24px 0;background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:18px;">
                <div style="font-size:13px;font-weight:700;color:#737373;margin-bottom:8px;">
                  Récapitulatif de votre message
                </div>
                <div style="font-size:14px;color:#171717;line-height:1.7;">
                  <strong>Sujet :</strong> ${escapeHtml(subject)}<br />
                  <strong>Téléphone :</strong> ${
                    phone ? escapeHtml(phone) : "Non renseigné"
                  }<br />
                  <strong>Message :</strong><br />
                  ${escapeHtml(message).replace(/\n/g, "<br />")}
                </div>
              </div>

              <p style="margin:0;font-size:14px;line-height:1.7;color:#525252;">
                Merci pour votre prise de contact.<br />
                <strong>CS Viriat</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (userMail.error) {
      return NextResponse.json(
        {
          error:
            "Le message a été envoyé au club, mais la confirmation utilisateur a échoué.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur lors de l’envoi du message." },
      { status: 500 },
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
