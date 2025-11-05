import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { loading } from "./loading";
import { apiSlice } from "./service/api.service";
import { debtorsApi } from "./service/debtor.service"; // Debtors xizmatini import qilamiz

const store = configureStore({
  reducer: combineReducers({
    loading: loading,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [debtorsApi.reducerPath]: debtorsApi.reducer, // Debtors reducerini qo'shamiz
  }),

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, debtorsApi.middleware), // Debtors middleware'ni qo'shamiz
  devTools: process.env.NODE_ENV !== "production",
});

export default store; // store'ni to'g'ri eksport qilamiz
