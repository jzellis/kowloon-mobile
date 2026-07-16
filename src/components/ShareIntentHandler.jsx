// ShareIntentHandler — bridges the OS share sheet into the composer.
//
// Mounted only in a dev-client/standalone build (NOT Expo Go — the native
// module doesn't exist there; the root layout guards this). When the user
// shares into Kowloon, we route to the composer prefilled:
//   URL   -> /compose?type=Link&href=...   (existing param path; OG preview fills the rest)
//   text  -> Note, editor seeded with the text
//   files -> Media, files added as attachments
//
// Renders nothing.

import { useEffect } from "react";
import { router } from "expo-router";
import { useShareIntent } from "expo-share-intent";

import { setPendingShare } from "../lib/pendingShare.js";

const URL_ONLY = /^https?:\/\/\S+$/i;

export default function ShareIntentHandler() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    resetOnBackground: true,
  });

  useEffect(() => {
    if (!hasShareIntent || !shareIntent) return;

    // A URL — either a proper web-url share, or plain text that's just a link
    // (Android apps often share URLs as text/plain).
    const textUrl =
      typeof shareIntent.text === "string" && URL_ONLY.test(shareIntent.text.trim())
        ? shareIntent.text.trim()
        : null;
    const url = shareIntent.webUrl || textUrl;

    if (url) {
      router.push(`/compose?type=Link&href=${encodeURIComponent(url)}`);
    } else if (Array.isArray(shareIntent.files) && shareIntent.files.length) {
      setPendingShare({
        kind: "files",
        files: shareIntent.files.map((f) => ({
          uri: f.path,
          name: f.fileName,
          mimeType: f.mimeType,
        })),
      });
      router.push("/compose?fromShare=1");
    } else if (shareIntent.text) {
      setPendingShare({ kind: "text", text: shareIntent.text });
      router.push("/compose?fromShare=1");
    }

    resetShareIntent();
    // Only react to a new share arriving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent]);

  return null;
}
