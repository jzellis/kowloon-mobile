// useFeedSubject — resolve the circle or group behind the current feed view.
//
// The feed's `viewKey` is one of: "public", "server", a circle ID
// ("circle:...@domain"), or a group ID ("group:...@domain"). For the last two
// this hook fetches the underlying object and reports the viewer's relationship
// to it, so the feed toolbar can offer the right contextual action — "Copy" a
// circle you don't own, or "Join" a group you haven't joined.
//
// Returns { kind, subject, isOwner, isMember, loading } where kind is
// "circle" | "group" | null.

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useActiveClient } from "./useActiveClient.js";
import { useJoinedGroups } from "./useJoinedGroups.js";
import { selectActiveAccount } from "../state/accountsSlice.js";

function kindOf(viewKey) {
  if (typeof viewKey !== "string") return null;
  if (viewKey.startsWith("circle:")) return "circle";
  if (viewKey.startsWith("group:")) return "group";
  return null;
}

export function useFeedSubject(viewKey) {
  const client = useActiveClient();
  const account = useSelector(selectActiveAccount);
  const { groups: joinedGroups } = useJoinedGroups();

  const kind = kindOf(viewKey);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client || !kind) {
      setSubject(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const fetch =
      kind === "circle"
        ? client.feeds.getCircle({ circleId: viewKey })
        : client.feeds.getGroup({ groupId: viewKey });
    Promise.resolve(fetch)
      .then((res) => {
        if (cancelled) return;
        setSubject(res?.item || res?.circle || res?.group || res || null);
      })
      .catch(() => {
        if (!cancelled) setSubject(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, viewKey, kind]);

  const ownerId = subject?.actorId || subject?.actor?.id;
  const isOwner =
    !!account?.id && (subject?.isOwner === true || ownerId === account.id);
  const isMember =
    kind === "group"
      ? !!account?.id && joinedGroups.some((g) => g.id === viewKey)
      : subject?.isMember === true;

  return { kind, subject, isOwner, isMember, loading };
}
