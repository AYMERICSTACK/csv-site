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

    const result = await resend.emails.send({
      from,
      to: [user.email],
      subject: "Réinitialiser votre mot de passe — CS Viriat",
      html: `
        <div style="margin:0;padding:24px;background:#f7f7f7;font-family:Arial,sans-serif;color:#171717;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:28px;">
            <h1 style="margin:0 0 16px;font-size:24px;">Réinitialiser votre mot de passe</h1>
            <p style="line-height:1.6;">Bonjour,</p>
            <p style="line-height:1.6;">
              Une demande de réinitialisation du mot de passe de votre espace CS Viriat a été effectuée.
            </p>
            <p style="margin:24px 0;">
              <a href="${resetUrl}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px;">
                Choisir un nouveau mot de passe
              </a>
            </p>
            <p style="line-height:1.6;color:#666666;">
              Ce lien expire dans 1 heure. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.
            </p>
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
