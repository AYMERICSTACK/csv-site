"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function PlayerRosterSearch({ total }: { total: number }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(total);

  useEffect(() => {
    const normalizedQuery = normalizeSearch(query);
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-player-search-card]"),
    );

    let count = 0;

    cards.forEach((card) => {
      const haystack = normalizeSearch(card.dataset.playerSearch || "");
      const visible = !normalizedQuery || haystack.includes(normalizedQuery);
      card.hidden = !visible;
      if (visible) count += 1;
    });

    setVisibleCount(count);
  }, [query, total]);

  return (
    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
      <label
        htmlFor={inputId}
        className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-neutral-500"
      >
        Rechercher un joueur
      </label>

      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-orange-300">
        <Search className="h-5 w-5 shrink-0 text-neutral-400" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tapez un prénom ou un nom…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400 sm:text-sm"
        />

        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {query ? (
        <p className="mt-2 text-xs font-semibold text-neutral-500">
          {visibleCount} joueur{visibleCount > 1 ? "s" : ""} trouvé{visibleCount > 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  );
}
