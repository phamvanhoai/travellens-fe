import { api } from "@/services/api";

export type AITourSuggestion = {
  tour_id: number;
  name: string;
  description?: string;
  price: number;
  child_price?: number;
  schedule?: string;
  capacity?: number;
  thumbnail?: string;
  tour_category?: string;
  destinations?: { destination_id: number; name: string }[];
};

export type AIDestinationSuggestion = {
  destination_id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  latitude?: number;
  longitude?: number;
  destination_category?: string;
};

export type AISuggestions = {
  tours: AITourSuggestion[];
  destinations: AIDestinationSuggestion[];
} | null;

export type AIRecommendationParams = {
  cust_segment: string;
  tour_type: string;
  pax: number;
  budget_per_person_vnd: number;
};

export type AIRecommendationResult = AIDestinationSuggestion & {
  score: number;
  suggested_tour_type?: string;
  starting_price?: number;
  detail_link: string;
};

export type AIParseResponse = {
  success: boolean;
  message: string;
  data: AIRecommendationParams;
  missing_fields: string[];
};

export type AISearchResponse = {
  success: boolean;
  model_version?: string;
  missing_fields?: string[];
  parsed_data?: AIRecommendationParams;
  recommendations: AIRecommendationResult[];
};

export type AIHistoryItem = {
  id: number;
  travel_request: string;
  parsed_data: AIRecommendationParams;
  recommendations: AIRecommendationResult[];
  model_version: string;
  created_at: string;
};

export const aiService = {
  /**
   * Get suggestions based on filters (direct DB query, no AI)
   */
  async suggest(params: {
    destination_id?: number;
    tour_category_id?: number;
    budget?: number;
    keywords?: string[];
    travel_style?: string;
  }) {
    const response = await api.post("/suggestions", params);
    return response.data?.data || response.data;
  },

  /**
   * Parse natural language into structured preferences
   */
  async parseTravelRequest(travel_request: string): Promise<AIParseResponse> {
    const response = await api.post("/ai/parse-request", { travel_request });
    return response.data;
  },

  /**
   * Get Top-10 destination recommendations via Pipeline Model
   */
  async getRecommendations(params: AIRecommendationParams): Promise<AIRecommendationResult[]> {
    const response = await api.post("/ai/recommend", params);
    return response.data?.recommendations || response.data;
  },

  /**
   * Combined: parse text → AI predict → query DB → return Top-10
   * Single API call for the 1-step flow
   */
  async searchByText(travel_request: string): Promise<AISearchResponse> {
    const response = await api.post("/ai/search", { travel_request });
    return response.data;
  },

  /**
   * Get user search history
   */
  async getHistory(): Promise<AIHistoryItem[]> {
    const response = await api.get("/ai/history");
    return response.data?.history || [];
  },

  /**
   * Delete a history item
   */
  async deleteHistory(id: number): Promise<void> {
    await api.delete(`/ai/history/${id}`);
  }
};
