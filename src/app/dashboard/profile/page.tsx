"use client";

import { useState } from "react";
import { ImagePlus, Trash2, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [avatar, setAvatar] = useState("");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Update your personal information and avatar.</p>

      <div className="mt-6 flex flex-col gap-5 rounded-lg bg-slate-50 p-5 sm:flex-row sm:items-center">
        <div className="grid size-24 place-items-center overflow-hidden rounded-full bg-white text-brand-600 ring-1 ring-slate-200">
          {avatar ? <img src={avatar} alt="Avatar preview" className="h-full w-full object-cover" /> : <UserRound size={38} />}
        </div>
        <div className="flex-1">
          <p className="font-bold">Avatar</p>
          <p className="mt-1 text-sm text-slate-500">Upload JPG, PNG or WEBP. This will be sent as `avatar_file` when connected to the API.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white transition hover:bg-brand-700">
              <Upload size={16} /> Upload Avatar
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setAvatar(URL.createObjectURL(file));
                }}
              />
            </label>
            {avatar ? (
              <button type="button" onClick={() => setAvatar("")} className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-bold text-rose-600 hover:bg-rose-50">
                <Trash2 size={16} /> Remove
              </button>
            ) : (
              <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-500">
                <ImagePlus size={16} /> No image selected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {["Full Name", "Email", "Phone", "Country"].map((label) => (
          <label key={label} className="text-sm font-semibold">
            {label}
            <input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" defaultValue={label === "Full Name" ? "Sophie Martin" : ""} />
          </label>
        ))}
      </div>
      <Button className="mt-6">Update Profile</Button>
    </div>
  );
}
