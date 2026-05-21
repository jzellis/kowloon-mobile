// React hook returning the KowloonClient for the currently-active account,
// or null if no account is active. Components that need to make API calls
// should pull the client through this rather than reach into the client
// module directly — that way switching accounts re-renders consumers.

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectActiveAccount } from "../state/accountsSlice.js";
import { ensureClient, getCachedClient } from "./client.js";

export function useActiveClient() {
  const account = useSelector(selectActiveAccount);
  if (!account) return null;
  return ensureClient(account);
}

// Variant that runs `client.init()` once per account so session restoration
// from AsyncStorage completes before consumers try to call protected routes.
export function useInitActiveClient() {
  const account = useSelector(selectActiveAccount);
  useEffect(() => {
    if (!account) return;
    const client = ensureClient(account);
    if (!getCachedClient(`${account.id}:initialized`)) {
      client.init().catch(() => {});
    }
  }, [account?.id]);
  return account ? ensureClient(account) : null;
}
