import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const debtorsApi = createApi({
  reducerPath: "debtorsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  endpoints: (builder) => ({
    getDebtors: builder.query({
      query: () => "debtors",
    }),
  }),
});

export const { useGetDebtorsQuery } = debtorsApi;
