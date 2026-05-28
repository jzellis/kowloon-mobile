// Circle visibility helpers. A circle's `to` field is "@public", "@<domain>"
// (server-only), or "" / a user ID (private — only the owner). The server
// domain is needed to recognize the server-only tier.

export function circleVisibilityLabel(to, serverDomain) {
  if (to === "@public") return "Public";
  if (serverDomain && to === `@${serverDomain}`) return "Server";
  if (!to) return "Private";
  // A user-ID `to` (private to one person) or an unknown value — treat as private.
  return "Private";
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

// The picker options for the circle form. `serverTo` is "@<domain>".
export function circleVisibilityOptions(serverDomain, serverName) {
  return [
    { value: "@public", label: "Public", summary: "Anyone on the network." },
    {
      value: serverDomain ? `@${serverDomain}` : "@public",
      label: "Server",
      summary: `Members of ${serverName || serverDomain || "this server"}.`,
    },
    { value: "", label: "Private", summary: "Only you." },
  ];
}
