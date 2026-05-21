import { configureStore } from "@reduxjs/toolkit";
import accounts from "./accountsSlice.js";

export const store = configureStore({
  reducer: {
    accounts,
  },
});
