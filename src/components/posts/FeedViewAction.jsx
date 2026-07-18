// FeedViewAction — the contextual button shown next to the feed's view name.
//
// When you're reading a circle you don't own, it offers "Copy" (clone the
// circle into your own). Groups no longer show an action here: group feeds are
// being reworked so the main timeline only ever shows a group you belong to, so
// a "Join" prompt in the toolbar is unnecessary (see kowloon-mobile#18).

import { CopyCircleMenu } from "../circles/CopyCircleMenu.jsx";

// `kind`, `subject`, `isOwner` come from useFeedSubject, resolved once by the
// parent (FeedHeader) so the selector label and this action share a single fetch.
export function FeedViewAction({ kind, subject, isOwner }) {
  if (!kind || !subject || isOwner) return null;

  if (kind === "circle") {
    return <CopyCircleMenu circle={subject} compact />;
  }

  // group — no contextual action.
  return null;
}
