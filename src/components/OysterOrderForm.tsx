"use client";
import { useState, type FormEvent } from "react";

export default function OysterOrderForm() {
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/commandes-huitres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), phone: form.get("phone"), website: form.get("website"), quantity }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erreur de commande");
      setReference(result.reference || "confirmée");
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur de commande"); }
    finally { setBusy(false); }
  }
  if (reference) return <div role="status" className="rounded-2xl border border-green-300 bg-green-50 p-6 text-green-900"><h3 className="text-xl font-bold">Commande enregistrée !</h3><p>Référence : {reference}</p><p>Retrait le 23 décembre dès 18 h, paiement sur place. Un email de confirmation vous sera envoyé si le service mail est disponible.</p></div>;
  return <form onSubmit={submit} className="space-y-4 rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
    <h2 className="text-2xl font-black">Commander en ligne</h2>
    <p className="text-sm text-neutral-600">Sans création de compte · Paiement au retrait · Commandes jusqu’au 20 décembre 2026</p>
    <div className="grid gap-3 sm:grid-cols-2">{([['firstName','Prénom'],['lastName','Nom'],['email','Email'],['phone','Téléphone']] as const).map(([name,label])=><label key={name} className="text-sm font-bold">{label}<input name={name} required maxLength={name==='email'?254:100} type={name==='email'?'email':name==='phone'?'tel':'text'} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 font-normal" /></label>)}</div>
    <div className="hidden" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <label className="block text-sm font-bold">Nombre de bourriches (3 douzaines chacune)<input className="mt-1 block w-28 rounded-xl border border-neutral-300 px-3 py-3" type="number" min={1} max={30} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} required /></label>
    <p className="text-xl font-black">Total : {quantity * 34} €</p>
    <p className="text-xs text-neutral-600">Vos coordonnées servent uniquement à gérer cette commande. Elles sont accessibles aux responsables habilités du club.</p>
    {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
    <button disabled={busy || quantity < 1 || quantity > 30} className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:opacity-50">{busy?'Enregistrement…':'Confirmer ma commande'}</button>
  </form>;
}
