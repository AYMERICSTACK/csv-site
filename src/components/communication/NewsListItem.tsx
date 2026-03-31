"use client";

import Link from "next/link";
import { useState } from "react";
import DeleteNewsItemButton from "@/components/DeleteNewsItemButton";
import { useToast } from "@/components/ui/ToastProvider";
import { Eye, EyeOff, LinkIcon, SquarePen } from "lucide-react";

type NewsListItemProps = {
  item: {
    id: string;
    title: string;
    typeLabel: string;
    typeClasses: string;
    isPublished: boolean;
    excerpt: string | null;
    fileUrl: string | null;
    externalUrl: string | null;
    displayDate: string;
  };
  togglePublishAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
};

export default function NewsListItem({
  item,
  togglePublishAction,
  deleteAction,
}: NewsListItemProps) {
  const toast = useToast();
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) return null;

  return (
    <article className="rounded-2xl border border-orange-100 bg-gradient-to-r from-white to-orange-50/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${item.typeClasses}`}
          >
            {item.typeLabel}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              item.isPublished
                ? "border border-green-200 bg-green-100 text-green-700"
                : "border border-neutral-200 bg-neutral-100 text-neutral-600"
            }`}
          >
            {item.isPublished ? "Publié" : "Brouillon"}
          </span>
        </div>

        <div className="text-xs font-semibold text-neutral-500">
          {item.displayDate}
        </div>
      </div>

      <h3 className="mt-3 text-lg font-extrabold text-neutral-900">
        {item.title}
      </h3>

      {item.excerpt ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-700">
          {item.excerpt}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/espace-communication/${item.id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
        >
          <SquarePen size={15} />
          Modifier
        </Link>

        <form action={togglePublishAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            onClick={() => {
              toast.brand(
                item.isPublished
                  ? "Passage en brouillon..."
                  : "Publication en cours...",
                item.isPublished
                  ? "Le contenu est en train d’être masqué."
                  : "Le contenu est en train d’être publié.",
              );
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              item.isPublished
                ? "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {item.isPublished ? (
              <>
                <EyeOff size={15} />
                Passer en brouillon
              </>
            ) : (
              <>
                <Eye size={15} />
                Publier
              </>
            )}
          </button>
        </form>

        {item.fileUrl || item.externalUrl ? (
          <a
            href={item.fileUrl || item.externalUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
          >
            Ouvrir
            <LinkIcon size={15} />
          </a>
        ) : null}

        <DeleteNewsItemButton
          id={item.id}
          title={item.title}
          action={deleteAction}
          onOptimisticDelete={() => setIsHidden(true)}
          loadingTitle="Suppression en cours..."
          loadingDescription="Le contenu est en train d’être retiré."
          loadingVariant="danger"
        />
      </div>
    </article>
  );
}
