// Post type metadata — colors + labels, mirroring the web frontend's
// lib/postTypes.js. Each type's color is used for the icon tint, the picker
// underline, and the feed card accent.

export const POST_TYPES = {
  Note: { label: "Note", color: "#B76C00" },
  Article: { label: "Article", color: "#006893" },
  Media: { label: "Media", color: "#009084" },
  Link: { label: "Link", color: "#417843" },
  Event: { label: "Event", color: "#CC272E" },
};

export const POST_TYPE_NAMES = ["Note", "Article", "Media", "Link", "Event"];

// Types the composer can actually create today. Event still needs its own
// input UI (date picker, geocoding) and remains a stub until Phase 4.
export const COMPOSABLE_TYPES = ["Note", "Article", "Link", "Media"];
