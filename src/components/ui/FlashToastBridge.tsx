"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./ToastProvider";

const TOAST_MESSAGES: Record<
  string,
  {
    title: string;
    description?: string;
    variant?: "success" | "error" | "info" | "brand" | "danger";
  }
> = {
  deleted: {
    title: "Contenu supprimé",
    description: "Le contenu a bien été retiré.",
    variant: "danger",
  },
  updated: {
    title: "Modifications enregistrées ✅",
    description: "Le contenu a bien été mis à jour.",
    variant: "success",
  },
  created: {
    title: "Contenu créé ✅",
    description: "Le nouveau contenu a bien été ajouté.",
    variant: "success",
  },
  published: {
    title: "Contenu publié 🔥",
    description: "Le contenu est maintenant visible publiquement.",
    variant: "brand",
  },
  draft: {
    title: "Contenu repassé en brouillon",
    description: "Le contenu n’est plus visible publiquement.",
    variant: "info",
  },
  error: {
    title: "Une erreur est survenue",
    description: "L’action n’a pas pu être finalisée.",
    variant: "error",
  },
};

export default function FlashToastBridge() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const toastKey = searchParams.get("toast");

    if (!toastKey) return;

    const uniqueKey = `${pathname}?toast=${toastKey}`;

    if (handledRef.current === uniqueKey) return;
    handledRef.current = uniqueKey;

    const config = TOAST_MESSAGES[toastKey];

    if (config) {
      toast.showToast({
        title: config.title,
        description: config.description,
        variant: config.variant,
      });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");

    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams, toast]);

  return null;
}
