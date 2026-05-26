// Persisted feed-filter state, account-scoped.
//
// Holds the user's current viewKey ("public" | "server" | circle id) and
// active post-type filter. Hydrates from AsyncStorage on mount and writes
// back on every change so the filter survives app restarts.
//
// `fallbackDefaults` (optional): used only on initial hydration when
// AsyncStorage has no entry yet for this account — typically the user's
// server-side defaults so a fresh login lands on their saved view.

import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HARD_DEFAULTS = { viewKey: "public", activeTypes: [] };

function keyFor(accountId) {
  return accountId ? `kowloon:${accountId}:feedFilter` : null;
}

function fallbackHasValues(f) {
  return !!(
    f &&
    ((typeof f.viewKey === "string" && f.viewKey) ||
      (Array.isArray(f.activeTypes) && f.activeTypes.length))
  );
}

export function usePersistedFilter(accountId, fallbackDefaults) {
  const [hydrated, setHydrated] = useState(false);
  const [viewKey, setViewKey] = useState(HARD_DEFAULTS.viewKey);
  const [activeTypes, setActiveTypes] = useState(HARD_DEFAULTS.activeTypes);

  const storageKey = keyFor(accountId);

  // Set when AsyncStorage was empty at hydrate AND we haven't yet been able
  // to apply the caller's fallback defaults. A second effect watches the
  // fallback and applies it as soon as it has values — this avoids the race
  // where AsyncStorage finishes reading before the user's server-side
  // prefs have loaded.
  const awaitingFallback = useRef(false);

  function applyFallback(f) {
    if (typeof f.viewKey === "string" && f.viewKey) setViewKey(f.viewKey);
    if (Array.isArray(f.activeTypes)) setActiveTypes(f.activeTypes);
  }

  // Hydrate on account change.
  useEffect(() => {
    if (!storageKey) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    setHydrated(false);
    awaitingFallback.current = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.viewKey === "string") setViewKey(parsed.viewKey);
          if (Array.isArray(parsed.activeTypes))
            setActiveTypes(parsed.activeTypes);
        } else if (fallbackHasValues(fallbackDefaults)) {
          applyFallback(fallbackDefaults);
        } else {
          // Storage empty, no fallback yet — try again when it arrives.
          awaitingFallback.current = true;
        }
      } catch {
        // ignore — fall back to defaults
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Late-arriving fallback (user prefs loaded after the storage read).
  const fallbackSig = JSON.stringify(fallbackDefaults || null);
  useEffect(() => {
    if (!awaitingFallback.current) return;
    if (fallbackHasValues(fallbackDefaults)) {
      applyFallback(fallbackDefaults);
      awaitingFallback.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackSig]);

  // Persist on change (post-hydration).
  useEffect(() => {
    if (!hydrated || !storageKey) return;
    AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ viewKey, activeTypes })
    ).catch(() => {});
  }, [hydrated, storageKey, viewKey, activeTypes]);

  function toggleType(type) {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function clearTypes() {
    setActiveTypes([]);
  }

  return {
    hydrated,
    viewKey,
    setViewKey,
    activeTypes,
    setActiveTypes,
    toggleType,
    clearTypes,
  };
}
