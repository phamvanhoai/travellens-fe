import { api } from "./api";

export const savedItemService = {
  getSavedIds: async () => {
    const { data } = await api.get('/saved/ids');
    return data;
  },

  toggleTour: async (tourId: number) => {
    const { data } = await api.post(`/saved/tours/${tourId}/toggle`);
    return data;
  },

  toggleDestination: async (destinationId: number) => {
    const { data } = await api.post(`/saved/destinations/${destinationId}/toggle`);
    return data;
  },

  getSavedTours: async (params: { page?: number; limit?: number }) => {
    const { data } = await api.get('/saved/tours', { params });
    return data;
  },

  getSavedDestinations: async (params: { page?: number; limit?: number }) => {
    const { data } = await api.get('/saved/destinations', { params });
    return data;
  }
};
