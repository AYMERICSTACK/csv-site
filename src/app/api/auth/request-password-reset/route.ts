import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // ⚠️ IMPORTANT : on ne dit jamais si l'utilisateur existe ou non
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Génération token sécurisé
    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reinitialiser-mot-de-passe/${token}`;

    if (!resend) {
      console.warn("RESEND_API_KEY manquante — lien reset :", resetUrl);

      return NextResponse.json({
        success: true,
        resetUrl,
      });
    }

    await resend.emails.send({
      from: "CS Viriat <no-reply@ton-domaine.fr>",
      to: user.email,
      subject: "Définir votre mot de passe",
      html: `
    <p>Bonjour,</p>
    <p>Cliquez sur le lien ci-dessous pour définir votre mot de passe :</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>Ce lien expire dans 1 heure.</p>
  `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur password reset :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
