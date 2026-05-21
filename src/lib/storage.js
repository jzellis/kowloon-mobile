// Account-namespaced AsyncStorage adapter for @kowloon/client.
//
// The client library hardcodes its storage key ("kowloon_token"). To run
// multiple accounts side by side, each KowloonClient gets a storage adapter
// that transparently prefixes every key with `kowloon:<accountId>:`.
//
// Account-list state (which accounts exist, which one is active) lives in
// Redux + a separate AsyncStorage key — see ../state/accountsSlice.js.

import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "kowloon";

function namespaceKey(accountId, key) {
  return `${PREFIX}:${accountId}:${key}`;
}

export function makeAccountStorage(accountId) {
  if (!accountId) {
    throw new Error("makeAccountStorage requires an accountId");
  }
  return {
    async getItem(key) {
      return AsyncStorage.getItem(namespaceKey(accountId, key));
    },
    async setItem(key, value) {
      await AsyncStorage.setItem(namespaceKey(accountId, key), value);
    },
    async removeItem(key) {
      await AsyncStorage.removeItem(namespaceKey(accountId, key));
    },
    async clear() {
      const allKeys = await AsyncStorage.getAllKeys();
      const ours = allKeys.filter((k) => k.startsWith(`${PREFIX}:${accountId}:`));
      if (ours.length) await AsyncStorage.multiRemove(ours);
    },
  };
}

// Drop everything we know about an account: token, any client-cached values,
// and (caller's responsibility) the entry in the accounts slice.
export async function purgeAccountStorage(accountId) {
  const adapter = makeAccountStorage(accountId);
  await adapter.clear();
}

// Top-level (non-per-account) keys. We use this for the accounts-list state
// itself so it survives across account switches.
export const ROOT_KEYS = {
  accounts: `${PREFIX}:accounts`,
};

export const rootStorage = {
  async getItem(key) {
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
    await AsyncStorage.removeItem(key);
  },
};
