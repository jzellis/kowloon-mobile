// One-shot cross-screen signal: set after an action that should make the feed
// refresh the next time it regains focus (e.g. composing a post). This replaces
// blanket refresh-on-focus, which reloaded the timeline and jumped to the top
// every time you returned from a post detail or another tab.

let pending = false;

export function requestFeedRefresh() {
  pending = true;
}

// Returns whether a refresh was requested, and clears the flag.
export function consumeFeedRefresh() {
  const v = pending;
  pending = false;
  return v;
}
