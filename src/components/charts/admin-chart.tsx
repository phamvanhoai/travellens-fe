"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", revenue: 32000, bookings: 220 },
  { month: "Feb", revenue: 42000, bookings: 280 },
  { month: "Mar", revenue: 51000, bookings: 340 },
  { month: "Apr", revenue: 68000, bookings: 390 },
  { month: "May", revenue: 74000, bookings: 440 }
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="revenue" stroke="#1769ff" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BookingChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="bookings" fill="#0f766e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
