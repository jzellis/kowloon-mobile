// Bake EXIF orientation into pixels (and cap dimensions) before upload.
//
// Phone cameras store photos in the sensor's native (usually landscape) pixel
// orientation plus an EXIF "Orientation" tag telling viewers how to rotate for
// display. By the time an image passes through the OS share sheet / picker and
// reaches our server, that tag is frequently stripped while the pixels stay
// sideways -- so the server has nothing to auto-orient from and the photo lands
// rotated (this is why Diana's uploads came in on their side). We fix it at the
// source: expo-image-manipulator decodes the image respecting EXIF orientation
// and re-encodes it upright with the tag gone, so every downstream consumer
// (our server, the web app, other clients) renders it correctly no matter how
// they read EXIF.
//
// Only JPEG/HEIC carry EXIF orientation, so we normalize just those. PNG/GIF/
// WebP/video/audio pass through untouched -- normalizing a GIF would flatten its
// animation, and converting a transparent PNG to JPEG would wreck its alpha.
// HEIC is additionally transcoded to JPEG, a bonus since not every server or
// browser can decode HEIC.
//
// NOTE: this relies on expo-image-manipulator's native decoder honoring the EXIF
// orientation tag on load. That is its long-standing behavior, but it needs a
// real (non-Expo-Go) build to run, and should be verified on-device against a
// known-sideways photo before we trust it in the wild.

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// Cap the longest side. The server downsizes anyway, but doing it here keeps
// uploads fast and reliable on cellular (a 12MP phone JPEG is ~5MB; this makes
// it well under 1MB).
const MAX_DIM = 2048;

const ROTATABLE_MIME = /^image\/(jpe?g|heic|heif)$/i;
const ROTATABLE_EXT = /\.(jpe?g|heic|heif)$/i;

function isRotatableImage(mimeType, name) {
  if (mimeType && ROTATABLE_MIME.test(mimeType)) return true;
  if (!mimeType && name && ROTATABLE_EXT.test(name)) return true;
  return false;
}

// input: { uri, name, mimeType }  ->  { uri, name, mimeType } (possibly rewritten)
export async function normalizeImageForUpload({ uri, name, mimeType }) {
  if (!uri || !isRotatableImage(mimeType, name)) {
    return { uri, name, mimeType };
  }

  try {
    // Pass 1: decode (auto-oriented) + re-encode upright.
    let ref = await ImageManipulator.manipulate(uri).renderAsync();

    // Pass 2 (only if oversized): downscale, reusing the in-memory ref so we
    // don't touch disk twice. ref.width/height are already upright.
    const longest = Math.max(ref.width, ref.height);
    if (longest > MAX_DIM) {
      const scale = MAX_DIM / longest;
      ref = await ImageManipulator.manipulate(ref)
        .resize({
          width: Math.round(ref.width * scale),
          height: Math.round(ref.height * scale),
        })
        .renderAsync();
    }

    const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
    const base = (name || "").replace(/\.[^.]+$/, "") || `image-${Date.now()}`;
    return { uri: out.uri, name: `${base}.jpg`, mimeType: "image/jpeg" };
  } catch (e) {
    // Never block an upload on normalization -- a possibly-rotated image beats
    // no image. Fall back to the original file.
    console.warn("normalizeImageForUpload failed; using original:", e?.message);
    return { uri, name, mimeType };
  }
}
