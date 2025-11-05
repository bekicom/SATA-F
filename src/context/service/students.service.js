import { apiSlice } from "./api.service";

export const coinApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ========================
    // 🎓 Students
    // ========================
    getCoin: builder.query({
      query: () => "/students",
      providesTags: ["Students"],
    }),

    addStudent: builder.mutation({
      query: (body) => ({
        url: "/students",
        method: "POST",
        body: JSON.stringify(body),
      }),
      invalidatesTags: ["Students", "Classes"],
    }),

    updateStudent: builder.mutation({
      query: ({ id, body }) => ({
        url: `/students/${id}`,
        method: "PUT",
        body: JSON.stringify(body),
      }),
      invalidatesTags: ["Students", "Classes"],
    }),

    deleteStudent: builder.mutation({
      query: (id) => ({
        url: `/students/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Students", "Classes"],
    }),

    // ========================
    // 👨‍👩‍👧 Parents (Yangi qism)
    // ========================

    parentLogin: builder.mutation({
      query: (body) => ({
        url: "/parents/login",
        method: "POST",
        body: JSON.stringify(body),
      }),
    }),

    getParentOverview: builder.query({
      query: (studentId) => `/parents/overview/${studentId}`,
      providesTags: ["ParentOverview"],
    }),

    getParentChildren: builder.query({
      query: () => `/parents/children`,
      providesTags: ["ParentChildren"],
    }),

    getParentPayments: builder.query({
      query: () => `/parents/payments`,
      providesTags: ["ParentPayments"],
    }),

    getParentExams: builder.query({
      query: () => `/parents/exams`,
      providesTags: ["ParentExams"],
    }),
    updateStudentStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/students/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["Students"],
    }),
  }),
  overrideExisting: false,
});

// ✅ Hook exportlari
export const {
  useGetCoinQuery,
  useAddStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,

  // 🔹 Parent hooklari
  useParentLoginMutation,
  useGetParentOverviewQuery,
  useGetParentChildrenQuery,
  useGetParentPaymentsQuery,
  useGetParentExamsQuery,
  useUpdateStudentStatusMutation,
} = coinApi;
