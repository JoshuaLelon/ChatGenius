import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../baseQuery";

export const sampleApi = createApi({
  reducerPath: "sampleApi",
  baseQuery: axiosBaseQuery({
    baseUrl: "https://jsonplaceholder.typicode.com",
  }),
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    updateData: builder.mutation<any, any>({
      query: (body) => ({
        url: "/postdata",
        method: "POST",
        body: body,
      }),
    }),

    getData: builder.query<any, any>({
      query: (params) => ({
        url: "/todos/1",
        method: "GET",
        params: params,
      }),
    }),
  }),
});

export const { useGetDataQuery } = sampleApi;
