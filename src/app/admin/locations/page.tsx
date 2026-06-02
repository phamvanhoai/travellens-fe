"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

type LocationStatus = "Active" | "Draft";

type ManagedLocation = {
  id: string;
  name: string;
  destination: string;
  description: string;
  mapUrl: string;
  status: LocationStatus;
};

const initialLocations: ManagedLocation[] = [
  { id: "oia-cliffside", name: "Oia Cliffside Village", destination: "Santorini, Greece", description: "Whitewashed lanes and sunset terraces.", mapUrl: "/maps/oia.json", status: "Active" },
  { id: "ubud-rice-terraces", name: "Ubud Rice Terraces", destination: "Bali, Indonesia", description: "Green walking route through terraced fields.", mapUrl: "/maps/ubud.json", status: "Active" },
  { id: "lake-louise", name: "Lake Louise Viewpoint", destination: "Banff, Canada", description: "Glacier lake viewpoint with nearby trails.", mapUrl: "/maps/lake-louise.json", status: "Active" },
  { id: "arashiyama", name: "Arashiyama Bamboo Grove", destination: "Kyoto, Japan", description: "Bamboo forest walking route and temples.", mapUrl: "/maps/arashiyama.json", status: "Active" },
  { id: "eiffel-river", name: "Eiffel River Walk", destination: "Paris, France", description: "Scenic river path and city landmarks.", mapUrl: "/maps/paris-river.json", status: "Draft" },
  { id: "colosseum", name: "Colosseum Quarter", destination: "Rome, Italy", description: "Ancient landmark area with guided routes.", mapUrl: "/maps/rome.json", status: "Active" },
  { id: "burj-downtown", name: "Downtown Skyline", destination: "Dubai, UAE", description: "Modern skyline route and shopping district.", mapUrl: "/maps/dubai.json", status: "Active" }
];

const emptyLocation: ManagedLocation = {
  id: "",
  name: "",
  destination: "",
  description: "",
  mapUrl: "",
  status: "Draft"
};

export default function AdminLocationsPage() {
  const [items, setItems] = useState(initialLocations);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ManagedLocation | null>(null);
  const pageSize = 5;

  const visibleItems = items.filter((item) =>
    `${item.name} ${item.destination} ${item.mapUrl}`.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function saveLocation(payload: ManagedLocation) {
    if (editingLocation) {
      setItems((current) => current.map((item) => item.id === editingLocation.id ? payload : item));
    } else {
      setItems((current) => [...current, { ...payload, id: createSlug(payload.name) }]);
    }

    setEditingLocation(null);
    setCreating(false);
  }

  function deleteLocation(item: ManagedLocation) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;

    setItems((current) => current.filter((location) => location.id !== item.id));
    setPage((current) => Math.max(1, Math.min(current, Math.ceil((visibleItems.length - 1) / pageSize))));
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Location Management</h1>
            <p className="mt-1 text-sm text-slate-500">Create destination locations and attach map information.</p>
          </div>
          <Button onClick={() => setCreating(true)}><Plus size={17} /> Create Location</Button>
        </div>

        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-3 size-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
            placeholder="Search locations..."
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Location", "Destination", "Description", "Map URL", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <span className="flex items-center gap-2 font-semibold"><MapPin size={17} className="text-brand-600" /> {item.name}</span>
                  </td>
                  <td className="p-3 text-slate-600">{item.destination}</td>
                  <td className="max-w-56 truncate p-3 text-slate-600">{item.description}</td>
                  <td className="p-3 text-brand-600">{item.mapUrl || "Not attached"}</td>
                  <td className="p-3">
                    <span className={item.status === "Active" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex gap-2">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setEditingLocation(item)}>
                        <Pencil size={15} /> Edit
                      </Button>
                      <button type="button" onClick={() => deleteLocation(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50" aria-label={`Delete ${item.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="locations" onPageChange={setPage} />
      </div>

      {creating || editingLocation ? (
        <LocationForm
          key={editingLocation?.id ?? "create"}
          initialValue={editingLocation ?? emptyLocation}
          title={editingLocation ? "Edit Location" : "Create Location"}
          onClose={() => {
            setEditingLocation(null);
            setCreating(false);
          }}
          onSave={saveLocation}
        />
      ) : null}
    </>
  );
}

function LocationForm({
  title,
  initialValue,
  onClose,
  onSave
}: {
  title: string;
  initialValue: ManagedLocation;
  onClose: () => void;
  onSave: (payload: ManagedLocation) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="mt-6 grid gap-4">
          <Field label="Location Name"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Oia Cliffside Village" /></Field>
          <Field label="Destination"><input required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} className="input" placeholder="Santorini, Greece" /></Field>
          <Field label="Description"><textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" placeholder="Location description..." /></Field>
          <Field label="Map URL"><input value={form.mapUrl} onChange={(event) => setForm({ ...form, mapUrl: event.target.value })} className="input" placeholder="/maps/location.json" /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LocationStatus })} className="input">
              <option>Active</option><option>Draft</option>
            </select>
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Location</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none [&_.input:focus]:border-brand-600">
      {label}
      {children}
    </label>
  );
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
