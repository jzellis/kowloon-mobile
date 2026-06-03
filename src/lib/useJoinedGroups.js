// useJoinedGroups — return the groups the current viewer has joined.
//
// There's no dedicated "my groups" endpoint. Joined groups live as members of
// the user's `circles.groups` system circle. This hook:
//   1. resolves the current user (auth cache → init fallback)
//   2. reads user.circles.groups (a circle ID)
//   3. fetches that circle and returns members whose id starts with "group:"
//
// Members come back as compact subdocs ({ id, name, icon, url }), not full
// Group records — enough for a list display and tap-into-detail.

import { useCallback, useEffect, useState } from "react";

import { useActiveClient } from "./useActiveClient.js";

export function useJoinedGroups() {
  const client = useActiveClient();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!client) return;
      if (isRefresh) setLoading(false);
      else setLoading(true);
      setError(null);
      try {
        // Cached user → cold-start init fallback.
        let user = client.auth?.getUser?.();
        if (!user) {
          try {
            user = await client.init();
          } catch {
            user = null;
          }
        }
        const groupsCircleId = user?.circles?.groups;
        if (!groupsCircleId) {
          setGroups([]);
          return;
        }
        const circle = await client.feeds.getCircle({
          circleId: groupsCircleId,
        });
        const c = circle?.item || circle?.circle || circle;
        const members = Array.isArray(c?.members) ? c.members : [];
        setGroups(members.filter((m) => m?.id?.startsWith?.("group:")));
      } catch (e) {
        setError(e?.message || "Couldn't load your groups.");
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { groups, loading, error, refresh: () => load({ isRefresh: true }) };
}
