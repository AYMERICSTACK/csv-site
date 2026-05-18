"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  title?: string;
  minHeight?: number;
};

export default function HelloAssoWidget({
  src,
  title = "Paiement HelloAsso - Licences CSV Football",
  minHeight = 750,
}: Props) {
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const nextHeight = Number(event.data?.height);

      if (!Number.isFinite(nextHeight)) return;

      setHeight((currentHeight) => Math.max(currentHeight, nextHeight));
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <iframe
      id="haWidget"
      title={title}
      scrolling="auto"
      src={src}
      style={{ width: "100%", height, border: "none" }}
    />
  );
}
