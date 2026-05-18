"use client";

import { useState } from "react";

type PartnerLogoProps = {
  src?: string | null;
  alt: string;
};

export default function PartnerLogo({ src, alt }: PartnerLogoProps) {
  const [hasLogo, setHasLogo] = useState(Boolean(src));

  if (!src || !hasLogo) {
    return (
      <div className="text-center text-sm font-bold text-neutral-400">
        Logo à venir
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="max-h-16 w-auto object-contain"
      onError={() => setHasLogo(false)}
    />
  );
}
