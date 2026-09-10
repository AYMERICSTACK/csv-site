import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildWeekendRecap } from "@/lib/fff-weekend-admin-recap";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 });
  }
  return NextResponse.json(await buildWeekendRecap());
}
