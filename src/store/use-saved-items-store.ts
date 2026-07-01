import { create } from 'zustand';
import { savedItemService } from '@/services/saved-item.service';
import { useAuthStore } from '@/store/use-auth-store';

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

    try {
      const { data } = await savedItemService.getSavedIds();
      set({ 
        savedTours: data.tours || [], 
        savedDestinations: data.destinations || [],
        initialized: true
      });
    } catch (error) {
      console.error("Failed to initialize saved items", error);
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
      console.error("Failed to toggle tour", error);
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
      console.error("Failed to toggle destination", error);
      throw error;
    }
  },

  isTourSaved: (tourId: number) => get().savedTours.includes(tourId),
  isDestinationSaved: (destinationId: number) => get().savedDestinations.includes(destinationId),
  
  reset: () => set({ savedTours: [], savedDestinations: [], initialized: false })
}));
