"use client";

import React, { useEffect } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useSavedItemsStore } from "@/store/use-saved-items-store";
import { useToast } from "@/components/common/toast";

interface SaveButtonProps {
  id: string | number;
  type: "tour" | "destination";
  className?: string;
}

export function SaveButton({ id, type, className = "" }: SaveButtonProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const showToast = useToast();
  const { toggleTour, toggleDestination, isTourSaved, isDestinationSaved, init, initialized } = useSavedItemsStore();
  
  useEffect(() => {
    if (user && !initialized) {
      init();
    }
  }, [user, initialized, init]);

  const numericId = Number(id);
  const isNumericId = !Number.isNaN(numericId);
  const isSaved = isNumericId ? (type === "tour" ? isTourSaved(numericId) : isDestinationSaved(numericId)) : false;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast({ title: "Login required", description: "Please login to save items", variant: "error" });
      router.push("/login");
      return;
    }

    if (Number.isNaN(numericId)) {
      showToast({ title: "Error", description: "Cannot save mock items.", variant: "error" });
      return;
    }

    try {
      if (type === "tour") {
        await toggleTour(numericId);
      } else {
        await toggleDestination(numericId);
      }
    } catch {
      showToast({ title: "Error", description: "Failed to save item. Please try again.", variant: "error" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`grid size-9 place-items-center rounded-full bg-white/90 transition-colors hover:scale-110 ${
        isSaved ? "text-red-500" : "text-brand-600 hover:text-red-500"
      } ${className}`}
    >
      <Heart size={17} className={isSaved ? "fill-current" : ""} />
    </button>
  );
}
