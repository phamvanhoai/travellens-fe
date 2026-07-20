"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, UserCheck, Shield, ShieldAlert, MapPin, Map, ImageIcon, Star, FileText, Image as ImageIcon2 } from "lucide-react";

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ----- User Statistics Components -----

export function UserStatsCards({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-slate-800">{data.total?.total_users || 0}</p>
        </div>
      </div>
    </div>
  );
}

export function UserRoleChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="total"
          nameKey="role"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function UserStatusChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="total"
          nameKey="status"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ----- Location Statistics Components -----

export function LocationStatsCards({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
          <MapPin size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Locations</p>
          <p className="text-2xl font-bold text-slate-800">{data.locations?.total_locations || 0}</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
          <Map size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Maps</p>
          <p className="text-2xl font-bold text-slate-800">{data.maps?.total_maps || 0}</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
          <ImageIcon size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">360 Views</p>
          <p className="text-2xl font-bold text-slate-800">{data.view360?.total_view360 || 0}</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-pink-100 text-pink-600 rounded-full">
          <ImageIcon2 size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">360 Images</p>
          <p className="text-2xl font-bold text-slate-800">{data.view360_images?.total_view360_images || 0}</p>
        </div>
      </div>
    </div>
  );
}

export function TopReviewedLocationsChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500">No data</div>;

  // Format data for chart
  const formattedData = data.map(item => ({
    name: item.location_name || `Loc ${item.location_id}`,
    reviews: parseInt(item.total_reviews),
    rating: parseFloat(item.average_rating)
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
        <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="reviews" name="Total Reviews" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="rating" name="Avg Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ----- Content Statistics Components -----

export function ContentStatsCards({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
          <FileText size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Blogs</p>
          <p className="text-2xl font-bold text-slate-800">{data.blogs?.total_blogs || 0}</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
          <Star size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Total Reviews</p>
          <p className="text-2xl font-bold text-slate-800">{data.reviews?.total_reviews || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Avg Rating: {data.reviews?.average_rating || 0}</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
          <ImageIcon2 size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Reviews w/ Photos</p>
          <p className="text-2xl font-bold text-slate-800">{data.review_photos?.reviews_with_photos || 0}</p>
        </div>
      </div>
    </div>
  );
}
