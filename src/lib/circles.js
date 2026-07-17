// Circle visibility helpers. A circle's `to` field is "@public", "@<domain>"
// (server-only), or the owner's own user ID ("Only Me" — self-only). The server
// domain is needed to recognize the server-only tier.
//
// NOTE: self-only must address the owner's user ID, NOT "" — the server treats
// an empty `to` as server-wide visibility, so an empty-`to` circle is not
// actually private.

export function circleVisibilityLabel(to, serverDomain) {
  if (to === "@public") return "Public";
  if (serverDomain && to === `@${serverDomain}`) return "Server";
  if (!to) return "Only Me";
  // A user-ID `to` (self-only) or an unknown value — treat as self-only.
  return "Only Me";
}

// createCircle's response shape has shifted over time — try the known paths
// for the new circle's ID.
export function extractCircleId(res) {
  return (
    res?.createdId ||
    res?.created?.id ||
    res?.result?.created?.id ||
    res?.result?.id ||
    res?.activity?.object?.id ||
    res?.id ||
    null
  );
}

// The picker options for the circle form. `serverDomain` is "<domain>",
// `ownerId` is the current user's Kowloon ID (used for the self-only tier).
export function circleVisibilityOptions(serverDomain, serverName, ownerId) {
  return [
    { value: "@public", label: "Public", summary: "Anyone on the network." },
    {
      value: serverDomain ? `@${serverDomain}` : "@public",
      label: "Server",
      summary: `Members of ${serverName || serverDomain || "this server"}.`,
    },
    // Self-only must address the owner's user ID (an empty `to` is server-wide).
    { value: ownerId || "", label: "Only Me", summary: "Only you can see this circle." },
  ];
}
