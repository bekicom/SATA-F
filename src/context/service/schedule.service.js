import { apiSlice } from "./api.service";

export const scheduleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔹 Yangi dars qo‘shish
    addLesson: builder.mutation({
      query: (body) => ({
        url: "/schedule",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Schedule"],
    }),

    // 🔹 Guruh bo‘yicha jadvalni olish
    getScheduleByClass: builder.query({
      query: (groupId) => `/schedule/class/${groupId}`,
      providesTags: ["Schedule"],
    }),

    // 🔹 O‘qituvchi bo‘yicha jadvalni olish
    getScheduleByTeacher: builder.query({
      query: (teacherId) => `/schedule/teacher/${teacherId}`,
      providesTags: ["Schedule"],
    }),

    // 🔹 Darsni yangilash
    updateLesson: builder.mutation({
      query: ({ id, body }) => ({
        url: `/schedule/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Schedule"],
    }),

    // 🔹 Darsni o‘chirish
    deleteLesson: builder.mutation({
      query: (id) => ({
        url: `/schedule/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Schedule"],
    }),
  }),
  overrideExisting: false, // ✅ agar boshqa joyda ham Schedule API ishlatsa xato bermaydi
});

// Hooklarni eksport qilish
export const {
  useAddLessonMutation,
  useGetScheduleByClassQuery,
  useGetScheduleByTeacherQuery,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
} = scheduleApi;
