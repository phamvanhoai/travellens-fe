import { DestinationCard } from "@/components/cards/destination-card";
import { TourCard } from "@/components/cards/tour-card";
import { destinations, tours } from "@/lib/data";

export default function SavedPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Saved Tours & Destinations</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {destinations.slice(0, 3).map((item) => <DestinationCard key={item.id} destination={item} />)}
        {tours.slice(0, 3).map((item) => <TourCard key={item.id} tour={item} />)}
      </div>
    </div>
  );
}
