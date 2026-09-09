import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { resend } from "@/lib/resend";

function getResetBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.error("NEXT_PUBLIC_SITE_URL invalide :", configured);
    }
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    // On vérifie la configuration email avant de chercher l'utilisateur :
    // cela évite d'afficher un faux succès si Resend n'est pas configuré.
    const from = process.env.RESEND_FROM_EMAIL?.trim();

    if (!resend || !from) {
      console.error(
        "Password reset indisponible : RESEND_API_KEY ou RESEND_FROM_EMAIL manquant.",
      );

      return NextResponse.json(
        {
          error:
            "Le service d’envoi d’email est momentanément indisponible. Contacte un administrateur du club.",
        },
        { status: 503 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    // On ne révèle jamais si l'adresse correspond ou non à un compte.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Un seul ensemble de liens actifs par utilisateur.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${getResetBaseUrl(request)}/reinitialiser-mot-de-passe/${token}`;

    const logoUrl = `${getResetBaseUrl(request)}/logo-csv-mail.png`;

    const result = await resend.emails.send({
      from,
      to: [user.email],
      subject: "Réinitialiser votre mot de passe — CS Viriat",
      html: `
        <div style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,sans-serif;color:#171717;">
          <div style="max-width:640px;margin:0 auto;padding:32px 20px;">

            <div style="background:#111111;border-radius:20px 20px 0 0;padding:24px 28px;text-align:center;">
              <img
                src="${logoUrl}"
                alt="CS Viriat"
                width="72"
                height="72"
                style="display:block;margin:0 auto 12px auto;"
              />
              <div style="font-size:24px;font-weight:800;color:#ffffff;">
                CS Viriat
              </div>
              <div style="margin-top:8px;font-size:13px;color:#ffffffb3;">
                Espace membre
              </div>
            </div>

            <div style="background:#ffffff;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 20px 20px;padding:28px;">
              <div style="height:4px;width:72px;background:#f97316;border-radius:999px;margin-bottom:24px;"></div>

              <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;color:#171717;">
                Réinitialiser votre mot de passe
              </h1>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#404040;">
                Bonjour,
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#404040;">
                Une demande de réinitialisation du mot de passe de votre espace
                <strong>CS Viriat</strong> a été effectuée.
              </p>

              <div style="margin:28px 0;text-align:center;">
                <a
                  href="${resetUrl}"
                  style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 22px;border-radius:12px;"
                >
                  Choisir un nouveau mot de passe
                </a>
              </div>

              <div style="margin-top:26px;background:#fafafa;border:1px solid #e5e5e5;border-radius:16px;padding:18px;">
                <div style="font-size:14px;font-weight:800;color:#171717;margin-bottom:6px;">
                  Ce lien expire dans 1 heure.
                </div>
                <div style="font-size:13px;line-height:1.6;color:#737373;">
                  Si vous n’êtes pas à l’origine de cette demande, vous pouvez simplement ignorer cet email.
                </div>
              </div>

              <div style="margin-top:26px;padding-top:22px;border-top:1px solid #eeeeee;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#737373;">
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                </p>
                <p style="margin:8px 0 0;font-size:12px;line-height:1.6;word-break:break-all;">
                  <a href="${resetUrl}" style="color:#f97316;text-decoration:none;">
                    ${resetUrl}
                  </a>
                </p>
              </div>

              <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#404040;">
                Sportivement,<br />
                <strong>CS Viriat</strong>
              </p>
            </div>

            <div style="padding:18px 20px;text-align:center;font-size:11px;line-height:1.6;color:#a3a3a3;">
              Message automatique envoyé depuis l’espace membre du CS Viriat.
            </div>
          </div>
        </div>
      `,
    });

    // Le SDK Resend peut renvoyer une erreur sans lever d'exception.
    // L'ancien code ignorait ce cas et affichait malgré tout "email envoyé".
    if (result.error) {
      console.error("Erreur Resend password reset :", result.error);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json(
        {
          error:
            "L’email n’a pas pu être envoyé. Réessaie dans quelques instants ou contacte un administrateur.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur password reset :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
