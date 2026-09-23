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
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Photo source invalide.");

  // EXIF orientations 5–8 exchange width and height. Coordinates below refer
  // to the image after auto-orientation, before the single JPEG encode.
  const sideways = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8;
  const width = sideways ? metadata.height : metadata.width;
  const height = sideways ? metadata.width : metadata.height;
  const fullBody = height / width >= 1.2;
  const side = fullBody ? Math.min(width, Math.round(width * 0.4)) : Math.min(width, height);
  const left = Math.max(0, Math.min(width - side, Math.round(width * (fullBody ? 0.52 : 0.5) - side / 2)));
  const top = fullBody ? Math.max(0, Math.min(height - side, Math.round(height * 0.03))) : Math.max(0, Math.round((height - side) / 2));

  return sharp(source)
    .rotate()
    .extract({ left, top, width: side, height: side })
    .resize(800, 800, { fit: "fill" })
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
