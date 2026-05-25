import { api } from "@/services/api";

export const reviewService = {
  create: (payload: unknown) => api.post("/reviews", payload),
  mine: () => api.get("/reviews/me")
};
