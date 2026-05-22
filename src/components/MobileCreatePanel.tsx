"use client";

import { ReactNode, useState } from "react";

type MobileCreatePanelProps = {
  title: string;
  description?: string;
  buttonLabel: string;
  children: ReactNode;
  defaultOpenOnDesktop?: boolean;
};

export default function MobileCreatePanel({
  title,
  description,
  buttonLabel,
  children,
  defaultOpenOnDesktop = true,
}: MobileCreatePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-950 sm:text-2xl">
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">
              {description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-csv-orange px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
        >
          {isOpen ? "Fermer" : buttonLabel}
        </button>
      </div>

      <div
        className={`border-t border-neutral-100 ${
          isOpen ? "block" : defaultOpenOnDesktop ? "hidden lg:block" : "hidden"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
