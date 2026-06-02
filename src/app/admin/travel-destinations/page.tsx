"use client";

import { useState } from "react";
import { ImagePlus, MapPin, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/common/pagination";
import { destinations as initialDestinations } from "@/lib/data";

type DestinationStatus = "Active" | "Draft";

type ManagedDestination = {
  id: string;
  name: string;
  country: string;
  category: string;
  region: string;
  priceFrom: number;
  image: string;
  status: DestinationStatus;
};

const destinations: ManagedDestination[] = initialDestinations.map((destination) => ({
  id: destination.id,
  name: destination.name,
  country: destination.country,
  category: destination.category,
  region: destination.region,
  priceFrom: destination.priceFrom,
  image: destination.image,
  status: "Active"
}));

const emptyDestination: ManagedDestination = {
  id: "",
  name: "",
  country: "",
  category: "Beach",
  region: "Asia",
  priceFrom: 0,
  image: "",
  status: "Draft"
};

export default function AdminDestinationsPage() {
  const [items, setItems] = useState(destinations);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingDestination, setEditingDestination] = useState<ManagedDestination | null>(null);
  const [deletingDestination, setDeletingDestination] = useState<ManagedDestination | null>(null);
  const pageSize = 5;

  const visibleItems = items.filter((item) =>
    `${item.name} ${item.country} ${item.category} ${item.region}`.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function saveDestination(payload: ManagedDestination) {
    if (editingDestination) {
      setItems((current) => current.map((item) => item.id === editingDestination.id ? payload : item));
    } else {
      setItems((current) => [...current, { ...payload, id: createSlug(payload.name) }]);
    }

    setEditingDestination(null);
    setCreating(false);
  }

  function deleteDestination() {
    if (!deletingDestination) return;

    setItems((current) => current.filter((destination) => destination.id !== deletingDestination.id));
    setPage((current) => Math.max(1, Math.min(current, Math.ceil((visibleItems.length - 1) / pageSize))));
    setDeletingDestination(null);
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">TravelDestination Management</h1>
            <p className="mt-1 text-sm text-slate-500">Create destinations and update display details used by public pages.</p>
          </div>
          <Button onClick={() => setCreating(true)}><Plus size={17} /> Create Destination</Button>
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
            placeholder="Search destinations..."
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Destination", "Country", "Category", "Region", "Price From", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <span className="flex items-center gap-3 font-semibold">
                      {item.image ? <img src={item.image} alt="" className="size-11 rounded-md object-cover" /> : <span className="grid size-11 place-items-center rounded-md bg-brand-50 text-brand-600"><MapPin size={17} /></span>}
                      {item.name}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{item.country}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">{item.region}</td>
                  <td className="p-3 font-semibold">${item.priceFrom}</td>
                  <td className="p-3">
                    <span className={item.status === "Active" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex gap-2">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setEditingDestination(item)}>
                        <Pencil size={15} /> Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeletingDestination(item)}
                        className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="destinations" onPageChange={setPage} />
      </div>

      {creating || editingDestination ? (
        <DestinationForm
          key={editingDestination?.id ?? "create"}
          initialValue={editingDestination ?? emptyDestination}
          title={editingDestination ? "Edit Destination" : "Create Destination"}
          onClose={() => {
            setEditingDestination(null);
            setCreating(false);
          }}
          onSave={saveDestination}
        />
      ) : null}

      {deletingDestination ? (
        <ConfirmDialog
          title="Delete Destination"
          message={`Are you sure you want to delete "${deletingDestination.name}, ${deletingDestination.country}"? This action cannot be undone in the current table state.`}
          onCancel={() => setDeletingDestination(null)}
          onConfirm={deleteDestination}
        />
      ) : null}
    </>
  );
}

function DestinationForm({
  title,
  initialValue,
  onClose,
  onSave
}: {
  title: string;
  initialValue: ManagedDestination;
  onClose: () => void;
  onSave: (payload: ManagedDestination) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Destination Name"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Santorini" /></Field>
          <Field label="Country"><input required value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="input" placeholder="Greece" /></Field>
          <Field label="Category">
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="input">
              {["Beach", "Nature", "Mountain", "City", "Culture", "Adventure"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Region">
            <select value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} className="input">
              {["Asia", "Europe", "North America", "South America", "Oceania", "Middle East"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Price From"><input required min="0" type="number" value={form.priceFrom} onChange={(event) => setForm({ ...form, priceFrom: Number(event.target.value) })} className="input" /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as DestinationStatus })} className="input">
              <option>Active</option><option>Draft</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">
              Destination Image
              <span className="mt-2 grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-[140px_1fr] sm:items-center">
                <span className="grid h-28 place-items-center overflow-hidden rounded-lg bg-slate-50 text-slate-400">
                  {form.image ? <img src={form.image} alt="Destination preview" className="h-full w-full object-cover" /> : <ImagePlus size={28} />}
                </span>
                <span>
                  <span className="block text-sm font-normal text-slate-500">Upload a JPG, PNG or WEBP image for the destination card and detail page.</span>
                  <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700">
                    <Upload size={16} /> Choose Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) setForm({ ...form, image: URL.createObjectURL(file) });
                      }}
                    />
                  </span>
                  {form.image ? (
                    <button type="button" onClick={() => setForm({ ...form, image: "" })} className="ml-3 text-sm font-bold text-rose-600">
                      Remove
                    </button>
                  ) : null}
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Destination</Button>
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
