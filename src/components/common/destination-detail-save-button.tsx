"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/toast";
import { useAuthStore } from "@/store/use-auth-store";
import { useSavedItemsStore } from "@/store/use-saved-items-store";

export function DestinationDetailSaveButton({
  id
}: {
  id: string | number;
}) {
  const router = useRouter();
  const showToast = useToast();
  const user = useAuthStore((state) => state.user);
  const savedDestinations = useSavedItemsStore((state) => state.savedDestinations);
  const initialized = useSavedItemsStore((state) => state.initialized);
  const init = useSavedItemsStore((state) => state.init);
  const toggleDestination = useSavedItemsStore((state) => state.toggleDestination);
  const [saving, setSaving] = useState(false);
  const destinationId = Number(id);
  const isValidId = Number.isFinite(destinationId) && destinationId > 0;
  const isSaved = isValidId && savedDestinations.includes(destinationId);

  useEffect(() => {
    if (user && !initialized) void init();
  }, [user, initialized, init]);

  async function handleSave(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!user) {
      showToast({ title: "Login required", description: "Please login to save this destination.", variant: "error" });
      router.push("/login");
      return;
    }

    if (!isValidId || saving) return;

    setSaving(true);
    try {
      await toggleDestination(destinationId);
      showToast({
        title: isSaved ? "Removed from wishlist" : "Saved to wishlist",
        description: isSaved ? "The destination was removed." : "You can find it in your saved destinations.",
        variant: "success"
      });
    } catch {
      showToast({ title: "Save failed", description: "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const icon = saving
    ? <Loader2 size={16} className="animate-spin" />
    : <Heart size={16} className={isSaved ? "fill-current" : ""} />;

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      aria-pressed={isSaved}
      className="rounded-lg bg-black/45 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      <span className="mr-2 inline-flex align-middle">{icon}</span>
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}
