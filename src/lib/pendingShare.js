// Hands an inbound OS share (text or files) to the composer. URLs don't need
// this — they route via /compose?type=Link&href=... — but text and file
// payloads are awkward as URL params, so ShareIntentHandler stashes them here
// and compose consumes them on mount (via ?fromShare=1).
//
//   { kind: "text", text }
//   { kind: "files", files: [{ uri, name, mimeType }] }

let pending = null;

export function setPendingShare(payload) {
  pending = payload;
}

export function consumePendingShare() {
  const v = pending;
  pending = null;
  return v;
}
