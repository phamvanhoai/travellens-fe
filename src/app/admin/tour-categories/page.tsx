import { CategoryManagement } from "@/components/admin/category-management";

const categories = [
  { id: "city-tour", name: "City Tour", description: "Guided urban sightseeing packages.", itemCount: 16, status: "Active" as const },
  { id: "family", name: "Family", description: "Comfortable itineraries for families.", itemCount: 12, status: "Active" as const },
  { id: "adventure", name: "Adventure", description: "Active and exploratory travel packages.", itemCount: 9, status: "Active" as const },
  { id: "luxury", name: "Luxury", description: "Premium experiences and private services.", itemCount: 6, status: "Active" as const },
  { id: "budget", name: "Budget", description: "Value-focused travel packages.", itemCount: 14, status: "Active" as const },
  { id: "weekend", name: "Weekend", description: "Short packages for weekend travel.", itemCount: 8, status: "Draft" as const }
];

export default function TourCategoriesPage() {
  return <CategoryManagement title="TourCategory Management" description="Classify bookable tours for listing filters." noun="tours" initialItems={categories} />;
}
