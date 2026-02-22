import { apiSlice } from "./api.service";

export const harajatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔹 Barcha harajatlarni olish
    getHarajat: builder.query({
      query: () => "/expenses",
      providesTags: ["Harajat"],
    }),

    // 🔹 Oylik harajatlar yig‘indisini olish
    getHarajatSummary: builder.query({
      query: () => "/expenses/summary",
      providesTags: ["Harajat"],
    }),

    // 🔹 Yangi harajat qo‘shish
    addHarajat: builder.mutation({
      query: (body) => ({
        url: "/expenses",
        method: "POST",
        body, // ❗ JSON.stringify shart emas
      }),
      invalidatesTags: ["Harajat", "School"],
    }),
    // 🔹 Harajatni tahrirlash
    updateHarajat: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/expenses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Harajat", "School"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetHarajatQuery,
  useGetHarajatSummaryQuery,
  useAddHarajatMutation,
  useUpdateHarajatMutation, // ✅
} = harajatApi;
