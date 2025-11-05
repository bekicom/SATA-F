import { apiSlice } from "./api.service";

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signInAdmin: builder.mutation({
      query: (body) => ({
        url: "/schools/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["School"],
    }),

    // Get all admins: GET - /get/admin
    getSchool: builder.query({
      query: () => "/get/school",
      providesTags: ["School"],
    }),
  }),
});

export const { useSignInAdminMutation, useGetSchoolQuery } = adminApi;
