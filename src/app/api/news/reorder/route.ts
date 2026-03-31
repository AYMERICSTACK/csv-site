import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type ReorderItem = {
  id: string;
  sortOrder: number;
};

export async function POST(request: Request) {
  try {
    await requireRole(["admin", "communication"]);

    const body = await request.json();
    const items: unknown[] = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json(
        { error: "Aucun élément à réordonner." },
        { status: 400 },
      );
    }

    const normalized: ReorderItem[] = items
      .map((item: unknown, index: number): ReorderItem | null => {
        if (typeof item !== "object" || item === null) {
          return null;
        }

        const value = item as {
          id?: unknown;
          sortOrder?: unknown;
        };

        if (typeof value.id !== "string" || !value.id.trim()) {
          return null;
        }

        return {
          id: value.id,
          sortOrder:
            typeof value.sortOrder === "number" &&
            Number.isFinite(value.sortOrder)
              ? value.sortOrder
              : index,
        };
      })
      .filter((item): item is ReorderItem => item !== null);

    if (!normalized.length) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    await prisma.$transaction(
      normalized.map((item: ReorderItem) =>
        prisma.newsItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur reorder news:", error);

    return NextResponse.json(
      { error: "Impossible de réordonner les contenus." },
      { status: 500 },
    );
  }
}
