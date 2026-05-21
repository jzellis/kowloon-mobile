// Accounts state — one entry per logged-in Kowloon account.
//
// Tokens are NOT stored here. They live in the namespaced AsyncStorage that
// each KowloonClient owns (see ../lib/storage.js). This slice tracks only the
// metadata the app needs to render account pickers, decide the initial route,
// and instantiate the right client.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { rootStorage, ROOT_KEYS, purgeAccountStorage } from "../lib/storage.js";
import { forgetClient } from "../lib/client.js";

const initialState = {
  // Loaded from AsyncStorage on app boot.
  list: [],
  activeId: null,
  // Hydration lifecycle for the splash gate.
  status: "idle", // idle | loading | ready | error
  error: null,
};

export const hydrateAccounts = createAsyncThunk(
  "accounts/hydrate",
  async () => {
    const raw = await rootStorage.getItem(ROOT_KEYS.accounts);
    if (!raw) return { list: [], activeId: null };
    try {
      const parsed = JSON.parse(raw);
      return {
        list: Array.isArray(parsed?.list) ? parsed.list : [],
        activeId: parsed?.activeId || null,
      };
    } catch {
      return { list: [], activeId: null };
    }
  }
);

async function persist(state) {
  await rootStorage.setItem(
    ROOT_KEYS.accounts,
    JSON.stringify({ list: state.list, activeId: state.activeId })
  );
}

const slice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    addAccount(state, action) {
      const account = action.payload;
      if (!account?.id) return;
      const existing = state.list.findIndex((a) => a.id === account.id);
      if (existing >= 0) {
        state.list[existing] = { ...state.list[existing], ...account };
      } else {
        state.list.push(account);
      }
      state.activeId = account.id;
    },
    setActive(state, action) {
      const id = action.payload;
      if (state.list.some((a) => a.id === id)) {
        state.activeId = id;
      }
    },
    updateAccount(state, action) {
      const { id, patch } = action.payload;
      const idx = state.list.findIndex((a) => a.id === id);
      if (idx >= 0) state.list[idx] = { ...state.list[idx], ...patch };
    },
    removeAccount(state, action) {
      const id = action.payload;
      state.list = state.list.filter((a) => a.id !== id);
      if (state.activeId === id) {
        state.activeId = state.list[0]?.id || null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAccounts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(hydrateAccounts.fulfilled, (state, action) => {
        state.list = action.payload.list;
        state.activeId = action.payload.activeId;
        state.status = "ready";
      })
      .addCase(hydrateAccounts.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error?.message || "Failed to load accounts";
      });
  },
});

export const { addAccount, setActive, updateAccount, removeAccount } = slice.actions;

// Thunk wrappers that persist after each mutation.
export const addAccountAndPersist = (account) => async (dispatch, getState) => {
  dispatch(addAccount(account));
  await persist(getState().accounts);
};

export const setActiveAndPersist = (id) => async (dispatch, getState) => {
  dispatch(setActive(id));
  await persist(getState().accounts);
};

export const updateAccountAndPersist = (id, patch) => async (dispatch, getState) => {
  dispatch(updateAccount({ id, patch }));
  await persist(getState().accounts);
};

export const signOutAccount = (id) => async (dispatch, getState) => {
  forgetClient(id);
  await purgeAccountStorage(id);
  dispatch(removeAccount(id));
  await persist(getState().accounts);
};

// Selectors
export const selectAccounts = (s) => s.accounts.list;
export const selectActiveId = (s) => s.accounts.activeId;
export const selectActiveAccount = (s) =>
  s.accounts.list.find((a) => a.id === s.accounts.activeId) || null;
export const selectAccountsStatus = (s) => s.accounts.status;

export default slice.reducer;
