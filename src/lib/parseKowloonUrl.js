// Parse a Kowloon URL into the object it points at, or return null for
// non-Kowloon URLs. Currently identifies post URLs only — users / circles /
// groups / server pages aren't routable on mobile yet, so they're treated as
// external. Extend here when those screens exist.

export function parseKowloonUrl(href) {
  if (!href) return null;
  try {
    const u = new URL(href);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    let m;
    if ((m = u.pathname.match(/^\/posts\/(post:[^/?#]+@[^/?#]+)/))) {
      return { type: "post", id: decodeURIComponent(m[1]) };
    }
    return null;
  } catch {
    return null;
  }
}

// Convenience: returns the post ID if href is a Kowloon post URL, else null.
export function kowloonPostIdFromUrl(href) {
  const parsed = parseKowloonUrl(href);
  return parsed && parsed.type === "post" ? parsed.id : null;
}
