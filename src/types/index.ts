export type Destination = {
  id: string;
  name: string;
  country: string;
  category: string;
  region: string;
  image: string;
  rating: number;
  reviews: string;
  priceFrom: number;
  currency?: string;
  badge?: string;
  description: string;
  bestTime: string;
};

export type Tour = {
  id: string;
  title: string;
  destination: string;
  image: string;
  rating: number;
  reviews: string;
  duration: string;
  price: number;
  currency?: string;
  category: string;
  capacity: string;
  badge?: string;
};

export type Booking = {
  id: string;
  tour: string;
  date: string;
  guests: number;
  status: "Confirmed" | "Pending" | "Cancelled";
  amount: number;
};
