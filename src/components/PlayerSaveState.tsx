"use client";

import { useEffect, useRef, useState } from "react";

type SaveState = "clean" | "dirty" | "saving";

export default function PlayerSaveState() {
  const markerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SaveState>("clean");

  useEffect(() => {
    const marker = markerRef.current;
    const form = marker?.closest("form");
    if (!form) return;

    const saveButton = form.querySelector<HTMLButtonElement>(
      '[data-player-save="true"]',
    );

    const updateButton = (nextState: SaveState) => {
      if (!saveButton) return;

      const inactiveClasses = ["opacity-50", "cursor-not-allowed"];
      const activeClasses = ["shadow-md", "ring-2", "ring-orange-200"];

      saveButton.disabled = nextState === "clean" || nextState === "saving";
      saveButton.textContent =
        nextState === "saving" ? "Enregistrement…" : "Enregistrer";

      inactiveClasses.forEach((className) =>
        saveButton.classList.toggle(className, nextState === "clean"),
      );
      activeClasses.forEach((className) =>
        saveButton.classList.toggle(className, nextState === "dirty"),
      );
    };

    const markDirty = () => {
      setState("dirty");
      updateButton("dirty");
    };

    const markSaving = () => {
      setState("saving");
      updateButton("saving");
    };

    updateButton("clean");
    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", markSaving);

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", markSaving);
    };
  }, []);

  return (
    <div ref={markerRef} className="min-h-5 text-xs font-bold" aria-live="polite">
      {state === "dirty" && (
        <span className="text-orange-700">● Modifications non enregistrées</span>
      )}
      {state === "saving" && (
        <span className="text-neutral-500">Enregistrement en cours…</span>
      )}
    </div>
  );
}
