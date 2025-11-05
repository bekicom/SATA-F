import { apiSlice } from "./api.service";

export const faApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔹 Fan qo‘shish
    addSubject: builder.mutation({
      query: (body) => ({
        url: "/subjects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subjects"],
    }),

    // 🔹 Barcha fanlarni olish
    getSubjects: builder.query({
      query: () => "/subjects",
      providesTags: ["Subjects"],
    }),

    // 🔹 Bitta fan
    getSubjectById: builder.query({
      query: (id) => `/subjects/${id}`,
      providesTags: (result, error, id) => [{ type: "Subjects", id }],
    }),

    // 🔹 Fan yangilash
    updateSubject: builder.mutation({
      query: ({ id, body }) => ({
        url: `/subjects/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Subjects", id }],
    }),

    // 🔹 Fan o‘chirish
    deleteSubject: builder.mutation({
      query: (id) => ({
        url: `/subjects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subjects"],
    }),
  }),
});

// Hooklarni eksport qilish
export const {
  useAddSubjectMutation,
  useGetSubjectsQuery,
  useGetSubjectByIdQuery,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = faApi;
