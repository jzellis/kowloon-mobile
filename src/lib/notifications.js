// Notification type metadata + route resolution.
//
// The server-built `href` field is unreliable in dev (literal "undefined://"
// scheme, bare mongo IDs instead of full kowloon IDs). The notification
// payload also carries `objectType` ("Post" | "Group" | "Circle" | "Page")
// and `objectId` (full kowloon ID like "post:abc@domain") — those are clean
// and stable, so we route off them instead of parsing href.

import {
  Check,
  MessageCircle,
  Newspaper,
  Smile,
  Users,
} from "lucide-react-native";

// `follow` is intentionally absent — adding someone to a circle is a private
// act of curation in Kowloon, the followed person is never notified. See
// feedback_no_follow_notifications memory.
export const NOTIF_TYPES = {
  reply: { label: "Reply", Icon: MessageCircle },
  react: { label: "Reaction", Icon: Smile },
  new_post: { label: "New post", Icon: Newspaper },
  join_request: { label: "Join request", Icon: Users },
  join_approved: { label: "Join approved", Icon: Check },
};

// Returns the mobile router path for a notification, or null if we can't
// route this one (e.g. an unrecognized objectType, or a User reference with
// no profile screen yet).
export function notificationRoute(notification) {
  const t = notification?.objectType;
  const id = notification?.objectId;
  if (!t || !id) return null;
  const enc = encodeURIComponent(id);
  switch (t) {
    case "Post":
      return `/post/${enc}`;
    case "Group":
      // Owner gets dropped on the moderation queue for join requests; everyone
      // else lands on the group detail.
      return notification?.type === "join_request"
        ? `/group/${enc}/pending`
        : `/group/${enc}`;
    case "Circle":
      return `/circle/${enc}`;
    case "Page":
      return `/pages/${enc}`;
    default:
      // "User" lands here; no profile screen yet so we don't route.
      return null;
  }
}
