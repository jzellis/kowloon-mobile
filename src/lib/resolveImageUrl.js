// Resolve a stored icon/image string into a fetchable URL.
//
// Kowloon stores icons/images as full URLs, relative paths (/images/...,
// /files/...), or bare values. RN's <Image> needs an absolute URL, so prepend
// the account's baseUrl for anything that isn't already absolute.
export function resolveImageUrl(value, baseUrl) {
  if (!value || typeof value !== "string") return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!baseUrl) return value;
  return `${baseUrl.replace(/\/$/, "")}/${value.replace(/^\//, "")}`;
}
