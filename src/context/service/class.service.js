import { apiSlice } from "./api.service";

export const classApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getClass: builder.query({
      query: () => ({
        url: "/groups",
        method: "GET",
        providesTags: ["Classes"],
      }),
    }),

    addClass: builder.mutation({
      query: (body) => ({
        url: "/groups",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Classes"],
    }),
    updateClass: builder.mutation({
      query: ({ group_id, ...body }) => ({
        url: `/groups/${group_id}`,
        method: "PUT",
        body: body,
      }),
      invalidatesTags: ["Classes"],
    }),

  }),
  overrideExisting: false,
});

export const { useGetClassQuery, useAddClassMutation, useUpdateClassMutation } = classApi;
