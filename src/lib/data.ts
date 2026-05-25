import type { Booking, Destination, Tour } from "@/types";

export const images = {
  hero: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=85",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85",
  swiss: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1200&q=85",
  kyoto: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=85",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=85",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85",
  banff: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85",
  queenstown: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1200&q=85",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=85",
  reef: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=85",
  balloons: "https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=1800&q=85"
};

export const destinations: Destination[] = [
  { id: "santorini", name: "Santorini", country: "Greece", category: "Beach", region: "Europe", image: images.santorini, rating: 4.8, reviews: "2.3K", priceFrom: 499, badge: "Popular", bestTime: "Apr - Oct", description: "Whitewashed cliff villages, caldera sunsets and blue-domed churches above the Aegean Sea." },
  { id: "bali", name: "Bali", country: "Indonesia", category: "Nature", region: "Asia", image: images.bali, rating: 4.7, reviews: "1.8K", priceFrom: 399, bestTime: "May - Sep", description: "Temple trails, beaches, rice terraces and serene wellness escapes." },
  { id: "swiss-alps", name: "Swiss Alps", country: "Switzerland", category: "Mountain", region: "Europe", image: images.swiss, rating: 4.9, reviews: "2.1K", priceFrom: 699, bestTime: "Jun - Sep", description: "Alpine lakes, scenic trains, snow peaks and refined mountain villages." },
  { id: "kyoto", name: "Kyoto", country: "Japan", category: "Culture", region: "Asia", image: images.kyoto, rating: 4.8, reviews: "2.7K", priceFrom: 599, bestTime: "Mar - May", description: "Historic temples, tea houses, gardens and autumn lanes." },
  { id: "maldives", name: "Maldives", country: "Maldives", category: "Beach", region: "Asia", image: images.maldives, rating: 4.9, reviews: "3.1K", priceFrom: 799, bestTime: "Nov - Apr", description: "Lagoon villas, coral gardens and slow island days." },
  { id: "paris", name: "Paris", country: "France", category: "City", region: "Europe", image: images.paris, rating: 4.7, reviews: "1.6K", priceFrom: 499, bestTime: "Apr - Jun", description: "Museums, cafes, river walks and luminous city landmarks." },
  { id: "banff", name: "Banff", country: "Canada", category: "Nature", region: "North America", image: images.banff, rating: 4.8, reviews: "1.2K", priceFrom: 699, bestTime: "Jun - Aug", description: "Glacier lakes, pine forests and dramatic Canadian Rockies views." },
  { id: "queenstown", name: "Queenstown", country: "New Zealand", category: "Adventure", region: "Oceania", image: images.queenstown, rating: 4.9, reviews: "980", priceFrom: 899, bestTime: "Dec - Feb", description: "Lakefront adventure capital with hiking, boating and mountain air." },
  { id: "dubai", name: "Dubai", country: "UAE", category: "City", region: "Middle East", image: images.dubai, rating: 4.6, reviews: "1.4K", priceFrom: 499, bestTime: "Nov - Mar", description: "Skyline icons, desert evenings and polished modern hospitality." },
  { id: "rome", name: "Rome", country: "Italy", category: "Culture", region: "Europe", image: images.rome, rating: 4.7, reviews: "1.3K", priceFrom: 449, bestTime: "Apr - Jun", description: "Ancient ruins, trattorias, fountains and living history." },
  { id: "great-barrier-reef", name: "Great Barrier Reef", country: "Australia", category: "Nature", region: "Oceania", image: images.reef, rating: 4.9, reviews: "870", priceFrom: 699, bestTime: "Jun - Oct", description: "Coral ecosystems, snorkeling trips and tropical coastlines." },
  { id: "machu-picchu", name: "Machu Picchu", country: "Peru", category: "Adventure", region: "South America", image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=85", rating: 4.8, reviews: "1.1K", priceFrom: 599, bestTime: "May - Sep", description: "Cloud forest trails and iconic Inca citadel viewpoints." }
];

export const tours: Tour[] = [
  { id: "santorini-sunset", title: "Santorini Sunset Tour", destination: "Santorini, Greece", image: images.santorini, rating: 4.8, reviews: "2.3K", duration: "5 Hours", price: 129, category: "Cultural", capacity: "2 - 16 People", badge: "Bestseller" },
  { id: "bali-cultural", title: "Bali Cultural Experience", destination: "Bali, Indonesia", image: images.kyoto, rating: 4.7, reviews: "1.8K", duration: "7 Hours", price: 89, category: "Cultural", capacity: "4 - 20 People", badge: "Popular" },
  { id: "swiss-adventure", title: "Swiss Alps Adventure", destination: "Interlaken, Switzerland", image: images.swiss, rating: 4.9, reviews: "2.1K", duration: "8 Hours", price: 199, category: "Adventure", capacity: "2 - 12 People" },
  { id: "maldives-hopping", title: "Maldives Island Hopping", destination: "Maldives", image: images.maldives, rating: 4.9, reviews: "3.1K", duration: "6 Hours", price: 149, category: "Beach", capacity: "2 - 10 People" },
  { id: "paris-city", title: "Paris City Highlights", destination: "Paris, France", image: images.paris, rating: 4.7, reviews: "1.6K", duration: "5 Hours", price: 99, category: "City", capacity: "2 - 18 People" },
  { id: "banff-park", title: "Banff National Park Tour", destination: "Banff, Canada", image: images.banff, rating: 4.8, reviews: "1.2K", duration: "6 Hours", price: 159, category: "Nature", capacity: "2 - 14 People" },
  { id: "dubai-city", title: "Dubai City Tour", destination: "Dubai, UAE", image: images.dubai, rating: 4.6, reviews: "1.4K", duration: "7 Hours", price: 119, category: "City", capacity: "2 - 20 People" },
  { id: "rome-ancient", title: "Rome Ancient Wonders", destination: "Rome, Italy", image: images.rome, rating: 4.7, reviews: "1.3K", duration: "6 Hours", price: 109, category: "Cultural", capacity: "2 - 15 People" },
  { id: "reef-snorkel", title: "Great Barrier Reef Tour", destination: "Australia", image: images.reef, rating: 4.9, reviews: "870", duration: "8 Hours", price: 199, category: "Nature", capacity: "2 - 12 People" }
];

export const bookings: Booking[] = [
  { id: "BK-2048", tour: "Santorini Sunset Tour", date: "2026-06-18", guests: 3, status: "Confirmed", amount: 387 },
  { id: "BK-2052", tour: "Swiss Alps Adventure", date: "2026-07-04", guests: 2, status: "Pending", amount: 398 },
  { id: "BK-1988", tour: "Bali Cultural Experience", date: "2026-04-21", guests: 4, status: "Cancelled", amount: 356 }
];

export const reviews = [
  { name: "Emma Johnson", city: "New York, USA", quote: "Travel360 made our honeymoon planning effortless. The 360 previews made choosing simple.", rating: 5 },
  { name: "David Lee", city: "Toronto, Canada", quote: "The AI recommendations were spot on. We discovered places we never knew existed.", rating: 5 },
  { name: "Sophie Martin", city: "London, UK", quote: "Smooth booking, polished dashboards and reliable payment updates.", rating: 5 },
  { name: "Michael Brown", city: "Sydney, Australia", quote: "The virtual tours feel immersive and helped our family pick the right route.", rating: 5 }
];
