import { apiSlice } from "./api.service";

export const salaryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ===== GET =====

    getTeachers: builder.query({
      query: () => "/teachers",
      providesTags: ["Salary"],
    }),

    getSalary: builder.query({
      query: () => "/salary",
      providesTags: ["Salary"],
    }),

    getSalarySummary: builder.query({
      query: () => "/salary/summary", // ✅ to‘g‘rilandi
      providesTags: ["Salary"],
    }),

    // ===== POST =====

    paySalary: builder.mutation({
      query: (salaryData) => ({
        url: "/salary",
        method: "POST",
        body: salaryData,
      }),
      invalidatesTags: ["Salary", "School"],
    }),

    createExchange: builder.mutation({
      query: (body) => ({
        url: "/salary/exchange", // ✅ to‘g‘rilandi
        method: "POST",
        body,
      }),
      invalidatesTags: ["Salary"],
    }),

    addAttendanceSalary: builder.mutation({
      query: (attendanceData) => ({
        url: "/salary/attendance",
        method: "POST",
        body: attendanceData,
      }),
      invalidatesTags: ["Salary", "School"],
    }),

    // ===== PUT =====

    updateSalary: builder.mutation({
      query: (body) => ({
        url: "/salary",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Salary"],
    }),

    // ===== 🆕 PATCH (LOG EDIT) =====

    updateSalaryLog: builder.mutation({
      query: (body) => ({
        url: "/salary/log",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Salary"],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useGetSalaryQuery,
  useGetSalarySummaryQuery,
  usePaySalaryMutation,
  useCreateExchangeMutation,
  useUpdateSalaryMutation,
  useAddAttendanceSalaryMutation,
  useUpdateSalaryLogMutation, // 🆕 YANGI HOOK
} = salaryApi;
