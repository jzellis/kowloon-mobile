// orderUserCircles — normalize a raw getUserCircles() result into the list the
// UI should show for circle selection (audience selector, feed selector, etc.).
//
// The user's auto-created Following circle is pinned first (some people only
// ever use Following, so it should always be one tap away). Note it's created
// as type "Circle" (NOT "System") and addressed to the user themselves — that's
// how it stays private yet still appears in this list. So we identify it by its
// self-address (to === the user's own id), falling back to the name, rather
// than by type. `selfId` is the active account's id (e.g. @user@domain).
export function orderUserCircles(items, selfId) {
  const usable = (Array.isArray(items) ? items : []).filter(
    (c) => c?.id && c?.name && c?.type !== "System"
  );
  const idx = usable.findIndex(
    (c) =>
      (selfId && c.to === selfId) ||
      /^following$/i.test(String(c.name).trim())
  );
  if (idx > 0) {
    const [following] = usable.splice(idx, 1);
    usable.unshift(following);
  }
  return usable;
}
