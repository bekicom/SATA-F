import { apiSlice } from "./api.service";

export const salaryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all teachers: GET - /teachers
    getTeachers: builder.query({
      query: () => "/teachers",
      providesTags: ["Salary"],
    }),

    // Get all salary docs
    getSalary: builder.query({
      query: () => "/salary",
      providesTags: ["Salary"],
    }),

    // Salary summary
    getSalarySummary: builder.query({
      query: () => "/salary/get/summary",
      providesTags: ["Salary"],
    }),

    // Create exchange lesson
    createExchange: builder.mutation({
      query: (body) => ({
        url: "/exchange",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Salary"],
    }),

    // Update salary
    updateSalary: builder.mutation({
      query: (body) => ({
        url: "/salary/update",
        method: "PUT",
        body: body,
      }),
      invalidatesTags: ["Salary"],
    }),

    // Manual salary payment
    paySalary: builder.mutation({
      query: (salaryData) => ({
        url: "/salary",
        method: "POST",
        body: salaryData,
      }),
      invalidatesTags: ["Salary", "School"],
    }),

    // 🆕 Davomat asosida oylik yozish
    addAttendanceSalary: builder.mutation({
      query: (attendanceData) => ({
        url: "/salary/attendance",
        method: "POST",
        body: attendanceData,
      }),
      invalidatesTags: ["Salary", "School"],
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
  useAddAttendanceSalaryMutation, // 🆕 hook
} = salaryApi;
