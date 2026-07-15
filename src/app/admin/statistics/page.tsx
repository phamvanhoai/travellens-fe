"use client";

import { useEffect, useState } from "react";
import { statisticsService } from "@/services/statistics.service";
import { 
  UserStatsCards, UserRoleChart, UserStatusChart, 
  LocationStatsCards, TopReviewedLocationsChart, 
  ContentStatsCards 
} from "@/components/charts/system-stats-charts";

export default function AdminStatisticsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "locations" | "content">("users");
  const [userStats, setUserStats] = useState<any>(null);
  const [locationStats, setLocationStats] = useState<any>(null);
  const [contentStats, setContentStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [usersRes, locationsRes, contentRes] = await Promise.all([
          statisticsService.userStats(),
          statisticsService.locationStats(),
          statisticsService.contentStats()
        ]);

        setUserStats(usersRes.data.data);
        setLocationStats(locationsRes.data.data);
        setContentStats(contentRes.data.data);
      } catch (error) {
        console.error("Failed to fetch statistics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6" aria-label="Loading statistics" aria-busy="true">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-200" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white p-5"><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-5 h-7 w-16 rounded bg-slate-200" /></div>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white p-6"><div className="h-5 w-36 rounded bg-slate-200" /><div className="mx-auto mt-10 size-48 rounded-full bg-slate-100" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("users")}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${activeTab === "users" ? "bg-white shadow text-blue-700" : "text-slate-600 hover:bg-slate-200"
            }`}
        >
          User Statistics
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${activeTab === "locations" ? "bg-white shadow text-blue-700" : "text-slate-600 hover:bg-slate-200"
            }`}
        >
          Location Statistics
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors ${activeTab === "content" ? "bg-white shadow text-blue-700" : "text-slate-600 hover:bg-slate-200"
            }`}
        >
          Content Statistics
        </button>
      </div>

      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <UserStatsCards data={userStats} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Users by Role</h2>
              <UserRoleChart data={userStats?.by_role || []} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Users by Status</h2>
              <UserStatusChart data={userStats?.by_status || []} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "locations" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <LocationStatsCards data={locationStats} />
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Top Reviewed Locations</h2>
            <TopReviewedLocationsChart data={locationStats?.top_reviewed_locations || []} />
          </div>
        </div>
      )}

      {activeTab === "content" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ContentStatsCards data={contentStats} />
        </div>
      )}
    </div>
  );
}
