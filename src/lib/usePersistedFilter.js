// Persisted feed-filter state, account-scoped.
//
// Holds the user's current viewKey ("public" | "server" | circle id) and
// active post-type filter. Hydrates from AsyncStorage on mount and writes
// back on every change so the filter survives app restarts.

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULTS = { viewKey: "public", activeTypes: [] };

function keyFor(accountId) {
  return accountId ? `kowloon:${accountId}:feedFilter` : null;
}

export function usePersistedFilter(accountId) {
  const [hydrated, setHydrated] = useState(false);
  const [viewKey, setViewKey] = useState(DEFAULTS.viewKey);
  const [activeTypes, setActiveTypes] = useState(DEFAULTS.activeTypes);

  const storageKey = keyFor(accountId);

  // Hydrate on account change.
  useEffect(() => {
    if (!storageKey) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    setHydrated(false);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.viewKey === "string") setViewKey(parsed.viewKey);
          if (Array.isArray(parsed.activeTypes))
            setActiveTypes(parsed.activeTypes);
        }
      } catch {
        // ignore — fall back to defaults
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

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
    toggleType,
    clearTypes,
  };
}
