// Helpers for Kowloon identity strings and server URL inference.
//
// A canonical Kowloon ID looks like "@username@domain" (e.g. "@jzellis@kwln.org").
// Users may type it without the leading "@" or with the leading "@" alone, so
// normalize defensively.

const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d+)?$/i;
const IP_RE = /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/;
const LOCAL_RE = /^(localhost)(?::\d+)?$/i;

export function parseKowloonId(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/^@/, "");
  const at = trimmed.lastIndexOf("@");
  if (at < 1) return null;
  const username = trimmed.slice(0, at).trim();
  const domain = trimmed.slice(at + 1).trim().toLowerCase();
  if (!username || !domain) return null;
  if (!isValidDomain(domain)) return null;
  return {
    username,
    domain,
    id: `@${username}@${domain}`,
  };
}

export function isValidDomain(domain) {
  if (!domain) return false;
  return DOMAIN_RE.test(domain) || IP_RE.test(domain) || LOCAL_RE.test(domain);
}

// Infer a base URL from a bare domain. Production servers run on HTTPS; local
// dev (loopback or RFC1918 IP literals) falls back to HTTP so phones on the
// same Tailscale network can reach the dev server without TLS.
export function inferBaseUrl(domain) {
  if (!domain) return "";
  const lower = String(domain).trim().toLowerCase();
  if (LOCAL_RE.test(lower)) return `http://${lower}`;
  if (IP_RE.test(lower)) return `http://${lower}`;
  return `https://${lower}`;
}

// Strip protocol + trailing slash to recover a domain from a URL the user may
// have pasted into the override field.
export function domainFromUrl(url) {
  if (!url) return "";
  return String(url)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
}
