import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import Container from "@/components/Container";
const labels: Record<string,string> = {received:"Reçue",prepared:"Préparée",collected:"Retirée",cancelled:"Annulée"};
export default async function Page() {
  await requireRole(["admin","festivite"]);
  async function changeStatus(data:FormData) {"use server";await requireRole(["admin","festivite"]);const id=String(data.get("id")||"");const status=String(data.get("status")||"");if (!Object.keys(labels).includes(status)) return;await prisma.oysterOrder.update({where:{id},data:{status}});revalidatePath("/espace-festivite/commandes-huitres");}
  const orders=await prisma.oysterOrder.findMany({orderBy:{createdAt:"desc"}});
  const active=orders.filter(o=>o.status!=="cancelled");
  return <Container><main className="space-y-6 py-12"><Link href="/espace-festivite" className="font-bold text-orange-700">← Espace Festivités</Link><h1 className="text-3xl font-black">Commandes d’huîtres 2026</h1><div className="grid gap-3 sm:grid-cols-3"><p className="rounded-xl bg-orange-50 p-4"><strong>{active.length}</strong> commandes actives</p><p className="rounded-xl bg-orange-50 p-4"><strong>{active.reduce((s,o)=>s+o.quantity,0)}</strong> bourriches</p><p className="rounded-xl bg-orange-50 p-4"><strong>{active.reduce((s,o)=>s+o.quantity*o.unitPrice,0)} €</strong> à encaisser (hors annulations)</p></div><div className="space-y-3">{orders.map(o=><article key={o.id} className="rounded-xl border p-4"><p className="font-bold">{o.firstName} {o.lastName} · {o.quantity} bourriche(s) · {o.quantity*o.unitPrice} €</p><p className="text-sm">{o.email} · {o.phone}</p><p className="text-xs text-neutral-500">{o.createdAt.toLocaleString("fr-FR",{timeZone:"Europe/Paris"})} · {o.id}</p><form action={changeStatus} className="mt-3 flex gap-2"><input type="hidden" name="id" value={o.id}/><select name="status" defaultValue={o.status} className="rounded-lg border p-2">{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><button className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-bold text-white">Enregistrer</button></form></article>)}</div>{!orders.length&&<p>Aucune commande pour le moment.</p>}</main></Container>;
}
