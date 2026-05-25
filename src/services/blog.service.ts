import { api } from "@/services/api";

export const blogService = {
  list: () => api.get("/blogs"),
  detail: (id: string) => api.get(`/blogs/${id}`)
};
