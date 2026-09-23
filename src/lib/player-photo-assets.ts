import { put } from "@vercel/blob";
import sharp from "sharp";

function safeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function createPortraitBuffer(input: ArrayBuffer) {
  const source = Buffer.from(new Uint8Array(input));

  return sharp(source)
    .rotate()
    .resize(800, 800, {
      fit: "cover",
      position: sharp.strategy.attention,
      withoutEnlargement: false,
    })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

export async function uploadPlayerPhotoAssets(file: File, playerName: string) {
  if (!file || file.size === 0) return null;

  const base = safeName(playerName) || "joueur";
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const timestamp = Date.now();

  const photoBlob = await put(`players/${base}-${timestamp}.${extension}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const portraitBuffer = await createPortraitBuffer(await file.arrayBuffer());
  const portraitBlob = await put(`players/portraits/${base}-${timestamp}.jpg`, portraitBuffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: "image/jpeg",
  });

  return {
    photoUrl: photoBlob.url,
    portraitUrl: portraitBlob.url,
  };
}

export async function generatePlayerPortraitFromUrl(photoUrl: string, playerName: string) {
  const response = await fetch(photoUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`photo-fetch-${response.status}`);

  const portraitBuffer = await createPortraitBuffer(await response.arrayBuffer());
  const base = safeName(playerName) || "joueur";
  const portraitBlob = await put(`players/portraits/${base}-${Date.now()}.jpg`, portraitBuffer, {
    access: "public",
    addRandomSuffix: true,
    contentType: "image/jpeg",
  });

  return portraitBlob.url;
}
