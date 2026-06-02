import { CategoryManagement } from "@/components/admin/category-management";

const categories = [
  { id: "history", name: "History", description: "Historic landmarks, monuments and heritage sites.", itemCount: 18, status: "Active" as const },
  { id: "nature", name: "Nature", description: "Natural landscapes, parks and scenic attractions.", itemCount: 24, status: "Active" as const },
  { id: "beach", name: "Beach", description: "Coastal attractions, islands and beaches.", itemCount: 12, status: "Active" as const },
  { id: "museum", name: "Museum", description: "Museums and cultural collections.", itemCount: 9, status: "Active" as const },
  { id: "mountain", name: "Mountain", description: "Mountain attractions and elevated viewpoints.", itemCount: 7, status: "Draft" as const },
  { id: "market", name: "Market", description: "Local markets and shopping attractions.", itemCount: 11, status: "Active" as const }
];

export default function DestinationCategoriesPage() {
  return <CategoryManagement title="DestinationCategory Management" description="Classify TravelDestination records for browsing and filters." noun="destinations" initialItems={categories} />;
}
