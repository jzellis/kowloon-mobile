// Feed data hook — loads the active account's post feed from the server,
// page by page, via @kowloon/client.
//
// GET /posts returns an ActivityStreams OrderedCollectionPage:
//   { orderedItems: [...], currentPage, totalPages, totalItems, next }
// Authenticated requests return the viewer's visible feed (their circles +
// public); the client carries the account token, so no extra params needed.

import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveClient } from "./useActiveClient.js";

function dedupeById(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (item?.id && !seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function useFeed() {
  const client = useActiveClient();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false); // initial load
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Guard against overlapping loads and stale responses landing out of order.
  const inFlight = useRef(false);

  const load = useCallback(
    async (targetPage, mode) => {
      if (!client || inFlight.current) return;
      inFlight.current = true;

      if (mode === "initial") setLoading(true);
      else if (mode === "refresh") setRefreshing(true);
      else if (mode === "more") setLoadingMore(true);
      setError(null);

      try {
        const res = await client.feeds.getServerPosts({ page: targetPage });
        const items = res?.orderedItems || res?.items || [];
        setTotalPages(Number(res?.totalPages) || 1);
        setPage(targetPage);
        setPosts((prev) =>
          mode === "more" ? dedupeById([...prev, ...items]) : dedupeById(items)
        );
      } catch (e) {
        setError(e?.message || "Couldn't load the feed.");
      } finally {
        inFlight.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [client]
  );

  // Initial load when the screen mounts or the active account changes.
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setTotalPages(1);
    if (client) load(1, "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const refresh = useCallback(() => load(1, "refresh"), [load]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && !refreshing && page < totalPages) {
      load(page + 1, "more");
    }
  }, [load, loading, loadingMore, refreshing, page, totalPages]);

  return {
    posts,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
    hasMore: page < totalPages,
  };
}
