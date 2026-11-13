import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const deadline = new Date("2026-12-20T22:59:59.999Z");
export async function POST(request: NextRequest) {
  try {
    if (new Date() > deadline) return NextResponse.json({ error: "Les commandes sont closes." }, { status: 400 });
    const data = await request.json();
    // Champ piège contre les robots. Ne pas révéler sa présence.
    if (data.website) return NextResponse.json({ ok: true });
    const firstName = String(data.firstName || "").trim().slice(0, 100);
    const lastName = String(data.lastName || "").trim().slice(0, 100);
    const email = String(data.email || "").trim().toLowerCase().slice(0, 254);
    const phone = String(data.phone || "").trim().slice(0, 30);
    const quantity = Number(data.quantity);
    if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+0-9 .()-]{8,30}$/.test(phone) || !Number.isInteger(quantity) || quantity < 1 || quantity > 30) {
      return NextResponse.json({ error: "Vérifiez les informations et la quantité (1 à 30)." }, { status: 400 });
    }
    const order = await prisma.oysterOrder.create({ data: { firstName, lastName, email, phone, quantity } });
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (resend && from) {
      const escape = (v: string) => v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
      const summary = `<p>Commande n° ${escape(order.id)}</p><p>${quantity} bourriche(s) × 34 € = <strong>${quantity * 34} €</strong></p><p>Retrait le 23 décembre 2026 dès 18 h, salle des fêtes de Viriat. Paiement au retrait.</p>`;
      await Promise.allSettled([
        resend.emails.send({ from, to: email, subject: "CS Viriat – Confirmation de commande d’huîtres", html: `<p>Bonjour ${escape(firstName)},</p><p>Votre commande est enregistrée.</p>${summary}` }),
        ...(process.env.OYSTER_ORDERS_NOTIFY_EMAIL ? [resend.emails.send({ from, to: process.env.OYSTER_ORDERS_NOTIFY_EMAIL, subject: "Nouvelle commande d’huîtres – CS Viriat", html: `<p>${escape(firstName)} ${escape(lastName)} – ${escape(email)} – ${escape(phone)}</p>${summary}` })] : []),
      ]);
    }
    return NextResponse.json({ ok: true, reference: order.id });
  } catch {
    return NextResponse.json({ error: "La commande n’a pas pu être enregistrée. Réessayez." }, { status: 500 });
  }
}
