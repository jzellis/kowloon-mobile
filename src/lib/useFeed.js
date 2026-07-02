// Feed data hook — loads posts for the active filter selection.
//
// `viewKey` chooses the source:
//   "public"           → GET /posts?to=public    (public firehose, page-based)
//   "server"           → GET /posts?to=server    (server-only,     page-based)
//   "circle:<id>@..."  → GET /circles/:id/posts  (circle posts,    cursor-based)
//   "group:<id>@..."   → GET /groups/:id/posts   (group posts,     page-based)
//
// `activeTypes` filters by post type (empty = all types).
// `accountId`   scopes the local cache key so multi-account installs don't mix.
//
// Cache strategy (stale-while-revalidate):
//   On mount, the last 20 posts for this viewKey are read from AsyncStorage
//   and shown immediately. The normal network fetch runs in parallel and
//   replaces them when it lands. After every successful initial/refresh fetch
//   the cache is overwritten with the new first page.
//
// When `viewKey` or `activeTypes` changes the feed resets to page 1.

import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useActiveClient } from "./useActiveClient.js";

// ---- Cache helpers ----------------------------------------------------------

const CACHE_LIMIT = 20;

function cacheKey(accountId, viewKey) {
  if (!accountId || !viewKey) return null;
  return `kowloon:${accountId}:feedCache:${viewKey}`;
}

async function readCache(key) {
  if (!key) return null;
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeCache(key, posts) {
  if (!key || !posts?.length) return;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(posts.slice(0, CACHE_LIMIT)));
  } catch {
    // Non-fatal — cache miss on next open is the worst outcome.
  }
}

// ---- Feed helpers -----------------------------------------------------------

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

function isCircle(viewKey) {
  return typeof viewKey === "string" && viewKey.startsWith("circle:");
}

function isGroup(viewKey) {
  return typeof viewKey === "string" && viewKey.startsWith("group:");
}

// ---- Hook ------------------------------------------------------------------

export function useFeed({ viewKey = "public", activeTypes = [], accountId } = {}) {
  const client = useActiveClient();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Pagination cursor — meaning depends on the current view:
  //   server feeds → integer page number of last loaded page
  //   circle feeds → ISO `publishedAt` of the oldest loaded item, used as `before`
  const cursor = useRef(null);
  const inFlight = useRef(false);

  // Active-types JSON for the effect dep (arrays aren't ref-stable).
  const typesKey = JSON.stringify(activeTypes || []);

  const fetchPage = useCallback(
    async (mode) => {
      if (!client || inFlight.current) return;
      inFlight.current = true;

      if (mode === "initial") setLoading(true);
      else if (mode === "refresh") setRefreshing(true);
      else if (mode === "more") setLoadingMore(true);
      setError(null);

      try {
        let res;
        let items = [];

        if (isCircle(viewKey)) {
          // Circle feed — cursor-based via `before`.
          const before = mode === "more" ? cursor.current : undefined;
          res = await client.feeds.getCirclePosts({
            circleId: viewKey,
            types: activeTypes,
            before,
          });
          items = res?.orderedItems || res?.items || [];
          const oldest = items[items.length - 1]?.publishedAt;
          cursor.current = oldest || cursor.current;
          // No total available — assume more if we got a full-ish page.
          setHasMore(items.length >= 15);
        } else if (isGroup(viewKey)) {
          // Group feed — page-based. getGroupPosts takes a single `type`,
          // not an array, so when filtering pass the first active type only
          // (the picker is single-select for groups today).
          const page =
            mode === "more"
              ? (typeof cursor.current === "number" ? cursor.current : 0) + 1
              : 1;
          res = await client.feeds.getGroupPosts({
            groupId: viewKey,
            type: activeTypes?.[0],
            page,
          });
          items = res?.orderedItems || res?.items || [];
          const totalPages = Number(res?.totalPages) || 1;
          setHasMore(page < totalPages);
          cursor.current = page;
        } else {
          // Server feed (public or server) — page-based.
          const to = viewKey === "server" ? "server" : "public";
          const page =
            mode === "more"
              ? (typeof cursor.current === "number" ? cursor.current : 0) + 1
              : 1;
          res = await client.feeds.getServerPosts({
            to,
            types: activeTypes,
            page,
          });
          items = res?.orderedItems || res?.items || [];
          const totalPages = Number(res?.totalPages) || 1;
          setHasMore(page < totalPages);
          cursor.current = page;
        }

        setPosts((prev) =>
          mode === "more" ? dedupeById([...prev, ...items]) : dedupeById(items)
        );

        // Persist first page so the next launch can seed instantly.
        if (mode !== "more") {
          writeCache(cacheKey(accountId, viewKey), items);
        }
      } catch (e) {
        setError(e?.message || "Couldn't load the feed.");
      } finally {
        inFlight.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    // typesKey covers activeTypes; viewKey direct; client and accountId identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, viewKey, typesKey, accountId]
  );

  // Reset + load whenever the view or type filter changes (or account
  // changes, since useActiveClient swaps). Seed from cache immediately so
  // there's something to show while the network request runs.
  useEffect(() => {
    cursor.current = null;
    setPosts([]);
    setHasMore(true);

    if (!client) return;

    let cancelled = false;
    readCache(cacheKey(accountId, viewKey)).then((cached) => {
      if (!cancelled && cached?.length) setPosts(cached);
    });
    fetchPage("initial");

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, viewKey, typesKey]);

  const refresh = useCallback(() => {
    cursor.current = null;
    setHasMore(true);
    return fetchPage("refresh");
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      fetchPage("more");
    }
  }, [fetchPage, loading, loadingMore, refreshing, hasMore]);

  const removePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    refreshing,
    error,
    refresh,
    loadMore,
    hasMore,
    removePost,
  };
}
