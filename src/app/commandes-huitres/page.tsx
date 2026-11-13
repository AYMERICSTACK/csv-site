import Link from "next/link";
import Container from "@/components/Container";
import OysterOrderForm from "@/components/OysterOrderForm";
export const metadata = { title: "Vente d’huîtres d’Oléron | CS Viriat" };
export default function Page() { return <Container><main className="mx-auto max-w-3xl space-y-6 py-12"><Link href="/actualites" className="text-sm font-bold text-orange-700">← Retour aux manifestations</Link><h1 className="text-4xl font-black">🦪 Vente d’huîtres d’Oléron</h1><p>Pour Noël, commandez vos huîtres du CS Viriat : <strong>34 € la bourriche de 3 douzaines</strong>.</p><p><strong>Commande avant le 20 décembre 2026.</strong> Retrait le <strong>23 décembre dès 18 h</strong>, salle des fêtes de Viriat. Paiement sur place.</p><a className="inline-block rounded-xl border border-orange-500 px-5 py-3 font-bold text-orange-700" href="/bon-commande-huitres-2026.jpeg" download>Télécharger le bulletin de commande papier</a><OysterOrderForm /></main></Container>; }
