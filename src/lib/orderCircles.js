// orderUserCircles — normalize a raw getUserCircles() result into the list the
// UI should show for circle selection (audience selector, feed selector, etc.).
//
// The user's Following system circle is pinned first (some people only ever use
// Following, so it should always be one tap away). Every OTHER System circle
// (All Following, Groups, Blocked, Muted) is excluded — those aren't audiences
// or feeds a user picks by hand.
export function orderUserCircles(items) {
  const list = Array.isArray(items) ? items : [];
  const following = list.find(
    (c) =>
      c?.id &&
      c?.name &&
      c?.type === "System" &&
      /^following$/i.test(String(c.name).trim())
  );
  const userCircles = list.filter(
    (c) => c?.id && c?.name && c?.type !== "System"
  );
  return following ? [following, ...userCircles] : userCircles;
}
