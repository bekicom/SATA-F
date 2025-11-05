import { message } from "antd";
import { apiSlice } from "./api.service";

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPayment: builder.query({
      query: () => "/payments", // ✅ to‘g‘ri
      providesTags: ["Payment"],
    }),

    getPaymentLog: builder.query({
      query: () => "/payments/logs", // ✅ to‘g‘ri
      providesTags: ["Payment"],
    }),

    getUncompletedPayment: builder.query({
      query: () => "/payments/debts", // ✅ to‘g‘ri
      providesTags: ["Payment"],
    }),

    getPaymentSummary: builder.query({
      query: () => "/payments/summary", // ✅ to‘g‘ri
      providesTags: ["Payment"],
    }),

    getPaymentSummaryMonth: builder.query({
      query: ({ month }) => {
        if (!month) {
          throw (
            (new Error("Month parameter is required in MM-YYYY format"),
            message.error("Xato"))
          );
        }
        return `/payments/summary/month?month=${month}`; // ✅ to‘g‘ri
      },
      providesTags: ["Payment"],
    }),

    getPaymentById: builder.query({
      query: (id) => `/payments/${id}`, // ✅ to‘g‘ri
      providesTags: ["Payment"],
    }),

    createPayment: builder.mutation({
      query: (body) => ({
        url: "/payments", // ✅ backendda POST /payments
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Payment", "School"],
    }),

    editPayment: builder.mutation({
      query: ({ body, id }) => ({
        url: `/payments/${id}`, // ✅ backend PUT /payments/:id
        method: "PUT",
        body: body,
      }),
      invalidatesTags: ["Payment", "School"],
    }),

    deletePayment: builder.mutation({
      query: ({ id, password }) => ({
        url: `/payments/${id}`, // ✅ backend DELETE /payments/:id
        method: "DELETE",
        body: { password },
      }),
      invalidatesTags: ["Payment", "School"],
    }),

    checkDebtStatus: builder.mutation({
      query: (body) => ({
        url: "/payments/check", // ✅ to‘g‘ri
        method: "POST",
        body: body,
      }),
    }),
  }),
});


export const { useGetPaymentQuery, useGetPaymentLogQuery, useGetUncompletedPaymentQuery, useGetPaymentSummaryQuery, useGetPaymentSummaryMonthQuery, useCreatePaymentMutation, useGetPaymentByIdQuery, useCheckDebtStatusMutation,
  useEditPaymentMutation, useDeletePaymentMutation } = paymentApi;
