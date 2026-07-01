"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useSavedItemsStore } from "@/store/use-saved-items-store";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";

interface TourDetailSaveButtonProps {
  id: string | number;
}

export function TourDetailSaveButton({ id }: TourDetailSaveButtonProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const showToast = useToast();
  const { toggleTour, isTourSaved, init, initialized } = useSavedItemsStore();

  useEffect(() => {
    if (user && !initialized) {
      init();
    }
  }, [user, initialized, init]);

  const numericId = Number(id);
  const isNumericId = !Number.isNaN(numericId);
  const isSaved = isNumericId ? isTourSaved(numericId) : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast({ title: "Login required", description: "Please login to save items", variant: "error" });
      router.push("/login");
      return;
    }

    if (!isNumericId) {
      showToast({ title: "Error", description: "Cannot save mock items.", variant: "error" });
      return;
    }

    try {
      await toggleTour(numericId);
    } catch {
      showToast({ title: "Error", description: "Failed to save item. Please try again.", variant: "error" });
    }
  };

  return (
    <Button
      variant={isSaved ? "outline" : "primary"}
      className="mt-3 w-full"
      onClick={handleClick}
    >
      {isSaved ? "Remove from Wishlist" : "Add to Wishlist"}
    </Button>
  );
}
