import moment from "moment";
import { apiSlice } from "./api.service";

export const oquvchiDavomatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDavomat: builder.query({
      query: () => ({
        url: "/davomat/student",
        method: "GET",
      }),
      providesTags: ["Davomat"],
    }),
    getTeacherDavomat: builder.query({
      query: () => ({
        url: "/davomat/teacher/",
        method: "GET",
        params: { month: moment().format("MM-YYYY") },
      }),
      providesTags: ["Davomat"],
    }),
    addDavomat: builder.mutation({
      query: (body) => ({
        url: "/davomat/student",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Davomat"],
    }),
    addTeacherDavomat: builder.mutation({
      query: (body) => ({
        url: "/davomat/teacher/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Davomat"],
    }),
    addDavomatByScan: builder.mutation({
      query: (body) => ({
        url: "/davomat/student/scan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Davomat"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDavomatQuery,
  useGetTeacherDavomatQuery,
  useAddTeacherDavomatMutation,
  useAddDavomatMutation,
  useAddDavomatByScanMutation,
} = oquvchiDavomatApi;
