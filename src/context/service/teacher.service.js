import { apiSlice } from "./api.service";

export const carApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeachers: builder.query({
      query: () => ({
        url: "/teachers",
        method: "GET",
      }),
      providesTags: ["Teachers"],
    }),

    addTeacher: builder.mutation({
      query: (body) => ({
        url: "/teachers",
        method: "POST",
        body: JSON.stringify(body),
   
      }),
      invalidatesTags: ["Teachers"],
    }),

    addTeacherDavomat: builder.mutation({
      query: (body) => ({
        url: "/davomat/teacher/create",
        method: "POST",
        body: JSON.stringify(body),
      }),
      invalidatesTags: ["teacherdavomat", "Salary"],
    }),

    getTeacherDavomat: builder.query({
      query: () => ({
        url: "/davomat/teacher/get",
        method: "GET",
      }),
      providesTags: ["teacherdavomat", "Salary"],
    }),

    deleteTeacher: builder.mutation({
      query: (id) => ({
        url: `/teachers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teachers"],
    }),

    updateTeacher: builder.mutation({
      query: ({ id, body }) => ({
        url: `/teachers/${id}`,
        method: "PUT",
        body: JSON.stringify(body),
      }),
      invalidatesTags: ["Teachers"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTeachersQuery,
  useGetTeacherDavomatQuery,
  useAddTeacherDavomatMutation,
  useAddTeacherMutation,
  useDeleteTeacherMutation,
  useUpdateTeacherMutation,
} = carApi;
