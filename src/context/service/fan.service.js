import { apiSlice } from "./api.service";

export const faApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ================= FANLAR ================= */

    // 🔹 Fan qo‘shish
    addSubject: builder.mutation({
      query: (body) => ({
        url: "/subjects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subjects"],
    }),

    // 🔹 Barcha fanlar
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

    /* ================= CHORAKLAR ================= */

    // 🔹 4 ta chorak sanasini saqlash
    setQuarters: builder.mutation({
      query: (body) => ({
        url: "/quarters/set",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Quarters"],
    }),

    // 🔹 Maktab choraklarini olish
    getQuartersBySchool: builder.query({
      query: (schoolId) => `/quarters/${schoolId}`,
      providesTags: ["Quarters"],
    }),
  }),
});

// 🔥 Hooklar
export const {
  // fanlar
  useAddSubjectMutation,
  useGetSubjectsQuery,
  useGetSubjectByIdQuery,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,

  // choraklar
  useSetQuartersMutation,
  useGetQuartersBySchoolQuery,
} = faApi;
