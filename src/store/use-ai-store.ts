import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIRecommendationResult } from "@/services/ai.service";

type AIState = {
  travelRequest: string;
  results: AIRecommendationResult[];
  showResults: boolean;
  
  setTravelRequest: (request: string) => void;
  setResults: (results: AIRecommendationResult[]) => void;
  setShowResults: (show: boolean) => void;
  reset: () => void;
};

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      travelRequest: "",
      results: [],
      showResults: false,

      setTravelRequest: (travelRequest) => set({ travelRequest }),
      setResults: (results) => set({ results }),
      setShowResults: (showResults) => set({ showResults }),
      reset: () => set({ travelRequest: "", results: [], showResults: false }),
    }),
    {
      name: "travel360-ai-storage",
    }
  )
);
