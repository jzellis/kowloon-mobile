// Group helpers — visibility + RSVP labels, mirroring the server's enums.

export function groupVisibilityLabel(to, serverDomain) {
  if (to === "@public") return "Public";
  if (serverDomain && to === `@${serverDomain}`) return "Server";
  if (typeof to === "string" && to.startsWith("circle:")) return "Private circle";
  return "Private";
}

export function groupVisibilityOptions(serverDomain, serverName) {
  return [
    {
      value: "@public",
      label: "Public",
      summary: "Anyone on the network can find and join.",
    },
    {
      value: serverDomain ? `@${serverDomain}` : "@public",
      label: "Server",
      summary: `Visible to members of ${serverName || serverDomain || "this server"}.`,
    },
    // Circle-scoped values are appended dynamically by the form (one entry
    // per user-owned circle) so the picker can offer "only members of <my
    // circle> can see this group."
  ];
}

// RSVP policy values match the Group.rsvpPolicy enum on the server.
export const RSVP_POLICIES = [
  {
    value: "open",
    label: "Open",
    summary: "Anyone who can see the group can join immediately.",
  },
  {
    value: "serverOpen",
    label: "Server-open",
    summary:
      "Server members join immediately; others need admin approval.",
  },
  {
    value: "serverApproval",
    label: "Server approval",
    summary: "Server members need no approval; remote users do.",
  },
  {
    value: "approvalOnly",
    label: "Approval only",
    summary: "Every join request needs admin approval.",
  },
];

export function rsvpPolicyLabel(value) {
  return RSVP_POLICIES.find((p) => p.value === value)?.label || "Open";
}

// Whether a viewer's join click should send "Request" wording vs immediate
// "Join", based on policy + viewer locality. The server still enforces the
// real gate; this is just the button label.
export function joinNeedsApproval(rsvpPolicy, viewerIsLocal) {
  if (rsvpPolicy === "approvalOnly") return true;
  if (rsvpPolicy === "serverApproval" && !viewerIsLocal) return true;
  if (rsvpPolicy === "serverOpen" && !viewerIsLocal) return true;
  return false;
}
