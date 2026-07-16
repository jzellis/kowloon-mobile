// ShareIntentRouter — routes an inbound OS share into the composer.
//
// Uses expo-share-intent's CONTEXT (fed by <ShareIntentProvider> in the root
// layout), which is the supported way to receive the share on cold start via
// the deeplink. Mounted globally inside the provider + navigation context, so
// it catches both cold launches (share opens the app) and warm shares (app
// already running). Safe in Expo Go — the native module is optional there, so
// hasShareIntent simply stays false.
//
//   URL   -> /compose?type=Link&href=...  (OG preview fills title/image)
//   text  -> Note, editor seeded with the text
//   files -> Media, added as attachments

import { useEffect } from "react";
import { router, useRootNavigationState } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";

import { setPendingShare } from "../lib/pendingShare.js";

const URL_RE = /https?:\/\/\S+/i;

export function ShareIntentRouter() {
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  // On a cold-start share the handler can fire before the navigator mounts —
  // navigating then throws "Attempted to navigate before mounting the Root
  // Layout". Wait until the root navigation state has a key (= mounted).
  const navState = useRootNavigationState();
  const navReady = !!navState?.key;

  useEffect(() => {
    if (!navReady || !hasShareIntent || !shareIntent) return;

    // Prefer an explicit web-url; otherwise pull the first URL out of the shared
    // text (Feedly & many apps share "Title https://…" as text/plain).
    const textMatch =
      typeof shareIntent.text === "string" ? shareIntent.text.match(URL_RE) : null;
    const url = shareIntent.webUrl || (textMatch ? textMatch[0] : null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navReady, hasShareIntent, shareIntent]);

  return null;
}
