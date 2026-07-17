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

import { useEffect, useRef } from "react";
import { router, useRootNavigationState } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";

import { setPendingShare } from "../lib/pendingShare.js";

const URL_RE = /https?:\/\/\S+/i;

// Build the /compose target from a share payload; stashes text/files for the
// composer to consume, returns the route to navigate to (or null).
function targetFor(shareIntent) {
  const textMatch =
    typeof shareIntent.text === "string" ? shareIntent.text.match(URL_RE) : null;
  const url = shareIntent.webUrl || (textMatch ? textMatch[0] : null);
  if (url) return `/compose?type=Link&href=${encodeURIComponent(url)}`;
  if (Array.isArray(shareIntent.files) && shareIntent.files.length) {
    setPendingShare({
      kind: "files",
      files: shareIntent.files.map((f) => ({
        uri: f.path,
        name: f.fileName,
        mimeType: f.mimeType,
      })),
    });
    return "/compose?fromShare=1";
  }
  if (shareIntent.text) {
    setPendingShare({ kind: "text", text: shareIntent.text });
    return "/compose?fromShare=1";
  }
  return null;
}

export function ShareIntentRouter() {
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  // On a cold-start share the handler can fire before the navigator mounts —
  // navigating then throws "Attempted to navigate before mounting the Root
  // Layout". Gate on the root nav state having a key AND defer the push to the
  // next tick, so the navigation container has actually finished initializing.
  const navState = useRootNavigationState();
  const navReady = !!navState?.key;
  const handledRef = useRef(false);

  // Allow a fresh share to be handled again once the previous one cleared.
  useEffect(() => {
    if (!hasShareIntent) handledRef.current = false;
  }, [hasShareIntent]);

  useEffect(() => {
    if (!navReady || !hasShareIntent || !shareIntent || handledRef.current)
      return;
    const target = targetFor(shareIntent);
    if (!target) {
      resetShareIntent();
      return;
    }
    handledRef.current = true;
    const t = setTimeout(() => {
      router.push(target);
      resetShareIntent();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navReady, hasShareIntent, shareIntent]);

  return null;
}
