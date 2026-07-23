// Resolve a stored icon/image string into a fetchable URL.
//
// Kowloon stores icons/images as full URLs, relative paths (/images/...,
// /files/...), or bare values. RN's <Image> needs an absolute URL, so prepend
// the account's baseUrl for anything that isn't already absolute.
export function resolveImageUrl(value, baseUrl) {
  if (!value || typeof value !== "string") return null;
  let url;
  if (/^https?:\/\//i.test(value)) url = value;
  else if (!baseUrl) return value;
  else url = `${baseUrl.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
  // Percent-encode a raw file id in a /files/ URL. react-native-svg's <Image>
  // (HexAvatar, used for circle/group icons) and RN core <Image> silently fail
  // on the ':' and '@' in "file:<id>@<domain>" — they just draw nothing, which
  // is why group/circle avatars didn't appear (#69). The server URL-decodes the
  // path segment, so the file resolves identically.
  return url.replace(/\/files\/(file:[^/?#]+)/i, (_m, id) => `/files/${encodeURIComponent(id)}`);
}
