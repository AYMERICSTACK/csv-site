"use client";

import { useState, type SyntheticEvent } from "react";

type PlayerPortraitProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
};

type Crop = {
  zoom: number;
  y: number;
};

const DEFAULT_CROP: Crop = { zoom: 1.45, y: 20 };

function cropForImage(width: number, height: number): Crop {
  if (!width || !height) return DEFAULT_CROP;

  const ratio = width / height;

  // Les portraits HD V19.22 sont générés en carré 800x800 : on les affiche
  // sans zoom CSS supplémentaire afin de conserver le cadrage calculé côté serveur.
  if (ratio >= 0.95 && ratio <= 1.05) return { zoom: 1, y: 50 };

  // Most club photos are portrait/full-body shots. The narrower the image,
  // the more we zoom into its upper section so the player's face stays legible
  // inside the small avatars used on rankings and match cards.
  if (ratio <= 0.58) return { zoom: 2.15, y: 16 };
  if (ratio <= 0.72) return { zoom: 1.9, y: 17 };
  if (ratio <= 0.9) return { zoom: 1.62, y: 19 };
  if (ratio <= 1.15) return { zoom: 1.32, y: 22 };
  return { zoom: 1.18, y: 24 };
}

export default function PlayerPortrait({
  src,
  alt,
  className = "",
  imageClassName = "",
}: PlayerPortraitProps) {
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    setCrop(cropForImage(image.naturalWidth, image.naturalHeight));
  };

  return (
    <span className={`block overflow-hidden bg-neutral-200 ${className}`}>
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        className={`h-full w-full object-cover ${imageClassName}`}
        style={{
          objectPosition: `50% ${crop.y}%`,
          transform: `scale(${crop.zoom})`,
          transformOrigin: `50% ${crop.y}%`,
        }}
      />
    </span>
  );
}
