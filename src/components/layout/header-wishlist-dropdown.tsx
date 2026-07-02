"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedItemsStore } from "@/store/use-saved-items-store";
import { savedItemService } from "@/services/saved-item.service";
import { useAuthStore } from "@/store/use-auth-store";
import { useToast } from "@/components/common/toast";
import Link from "next/link";

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

export function HeaderWishlistDropdown({ onClose }: { onClose: () => void }) {
  const { savedTours, savedDestinations, toggleTour, toggleDestination } = useSavedItemsStore();
  const logout = useAuthStore((state) => state.logout);
  const showToast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (!hasAuthToken()) {
        logout();
        setItems([]);
        setIsLoading(false);
        return;
      }

      try {
        const [toursRes, destsRes] = await Promise.all([
          savedItemService.getSavedTours({ limit: 5 }),
          savedItemService.getSavedDestinations({ limit: 5 })
        ]);
        
        const merged = [
          ...toursRes.data.items.map((i: any) => ({
            id: i.tour_id,
            title: i.name,
            image: i.thumbnail,
            meta: "Tour",
            type: "tour",
            savedAt: new Date(i.saved_at).getTime()
          })),
          ...destsRes.data.items.map((i: any) => ({
            id: i.destination_id,
            title: i.name,
            image: i.thumbnail,
            meta: "Destination",
            type: "destination",
            savedAt: new Date(i.saved_at).getTime()
          }))
        ].sort((a, b) => b.savedAt - a.savedAt).slice(0, 5);

        setItems(merged);
      } catch (error) {
        if (isUnauthorized(error)) {
          logout();
          setItems([]);
          return;
        }

        console.warn("Failed to fetch wishlist");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
  }, [logout, savedTours.length, savedDestinations.length]); // refetch if count changes

  const handleRemove = async (id: number, type: "tour" | "destination", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic UI: remove item from list immediately to feel smooth
    setItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)));

    try {
      if (type === "tour") {
        await toggleTour(id);
      } else {
        await toggleDestination(id);
      }
    } catch {
      showToast({ title: "Error", description: "Failed to remove item", variant: "error" });
    }
  };

  const totalCount = savedTours.length + savedDestinations.length;

  return (
    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="font-bold text-ink">Wishlist</p>
          <p className="text-xs text-slate-500">Saved trips and tours</p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600">{totalCount} saved</span>
      </div>
      <div className="max-h-80 overflow-auto p-2">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
        ) : items.length === 0 ? (
          <p className="p-4 text-center text-sm text-slate-500">No saved items.</p>
        ) : (
          items.map((item) => (
            <Link 
              key={`${item.type}-${item.id}`} 
              href={item.type === "tour" ? `/tours/${item.id}` : `/destinations/${item.id}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
            >
              <img src={item.image || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85"} alt="" className="size-14 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                <p className="text-xs text-slate-500">{item.meta}</p>
              </div>
              <button 
                onClick={(e) => handleRemove(item.id, item.type, e)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-rose-500" 
                aria-label="Remove from wishlist"
              >
                <Trash2 size={15} />
              </button>
            </Link>
          ))
        )}
      </div>
      <div className="border-t border-slate-100 p-3">
        <Button href="/dashboard/saved" className="w-full" onClick={onClose}>
          View Saved
        </Button>
      </div>
    </div>
  );
}
