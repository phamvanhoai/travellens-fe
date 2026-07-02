import { create } from 'zustand';
import { savedItemService } from '@/services/saved-item.service';
import { useAuthStore } from '@/store/use-auth-store';

function hasAuthToken() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("travel360_token") ?? localStorage.getItem("token"));
}

function isUnauthorized(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 401
  );
}

function clearExpiredSession() {
  useAuthStore.getState().logout();
}

interface SavedItemsState {
  savedTours: number[];
  savedDestinations: number[];
  initialized: boolean;
  init: () => Promise<void>;
  toggleTour: (tourId: number) => Promise<void>;
  toggleDestination: (destinationId: number) => Promise<void>;
  isTourSaved: (tourId: number) => boolean;
  isDestinationSaved: (destinationId: number) => boolean;
  reset: () => void;
}

export const useSavedItemsStore = create<SavedItemsState>((set, get) => ({
  savedTours: [],
  savedDestinations: [],
  initialized: false,
  
  init: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    if (!hasAuthToken()) {
      clearExpiredSession();
      set({ savedTours: [], savedDestinations: [], initialized: false });
      return;
    }

    try {
      const { data } = await savedItemService.getSavedIds();
      set({ 
        savedTours: data.tours || [], 
        savedDestinations: data.destinations || [],
        initialized: true
      });
    } catch (error) {
      if (isUnauthorized(error)) {
        clearExpiredSession();
        set({ savedTours: [], savedDestinations: [], initialized: false });
        return;
      }

      console.warn("Failed to initialize saved items");
    }
  },

  toggleTour: async (tourId: number) => {
    const isSaved = get().isTourSaved(tourId);
    
    // Optimistic update
    set((state) => ({
      savedTours: isSaved 
        ? state.savedTours.filter(id => id !== tourId)
        : [...state.savedTours, tourId]
    }));

    try {
      await savedItemService.toggleTour(tourId);
    } catch (error) {
      // Revert on failure
      set((state) => ({
        savedTours: isSaved 
          ? [...state.savedTours, tourId]
          : state.savedTours.filter(id => id !== tourId)
      }));
      if (isUnauthorized(error)) clearExpiredSession();
      throw error;
    }
  },

  toggleDestination: async (destinationId: number) => {
    const isSaved = get().isDestinationSaved(destinationId);
    
    // Optimistic update
    set((state) => ({
      savedDestinations: isSaved 
        ? state.savedDestinations.filter(id => id !== destinationId)
        : [...state.savedDestinations, destinationId]
    }));

    try {
      await savedItemService.toggleDestination(destinationId);
    } catch (error) {
      // Revert on failure
      set((state) => ({
        savedDestinations: isSaved 
          ? [...state.savedDestinations, destinationId]
          : state.savedDestinations.filter(id => id !== destinationId)
      }));
      if (isUnauthorized(error)) clearExpiredSession();
      throw error;
    }
  },

  isTourSaved: (tourId: number) => get().savedTours.includes(tourId),
  isDestinationSaved: (destinationId: number) => get().savedDestinations.includes(destinationId),
  
  reset: () => set({ savedTours: [], savedDestinations: [], initialized: false })
}));
