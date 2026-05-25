import { create } from "zustand";

type AppState = {
  savedIds: string[];
  toggleSaved: (id: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  savedIds: ["santorini", "swiss-adventure"],
  toggleSaved: (id) =>
    set((state) => ({
      savedIds: state.savedIds.includes(id)
        ? state.savedIds.filter((item) => item !== id)
        : [...state.savedIds, id]
    }))
}));
